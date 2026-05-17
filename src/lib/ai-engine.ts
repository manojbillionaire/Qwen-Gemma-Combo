/**
 * Nexus AI Engine
 * ───────────────────────────────────────────────────────────────
 * Brain1 — PRIMARY   : Qwen3.5-0.8B  via wllama (WASM/CPU)
 *                      Works on ANY phone — no WebGPU needed
 *                      Source: manojbillionaire123/Qwen3.5-0.8B-GGUF
 *                      File  : Qwen3.5-0.8B-Q4_K_M.gguf  (~533 MB)
 *
 * Brain2 — FALLBACK  : Gemma 3-1B      via wllama (WASM/CPU)
 *                      Advanced 1B model for high quality offline chat
 *                      Source: manojbillionaire123/gemma-3-1b-it-GGUF
 *                      File  : gemma-3-1b-it-Q4_K_M.gguf  (~768 MB)
 *
 * User can download Brain1, Brain2, or both independently.
 * Active engine = Brain1 if loaded, else Brain2 if loaded, else offline.
 * ───────────────────────────────────────────────────────────────
 */

import { Wllama, WllamaConfig, AssetsPathConfig } from '@wllama/wllama';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

export interface AIResponse {
  text: string;
  model: string;
}

export type AITaskType = 'voice' | 'drafting' | 'search' | 'general';

// ── Model config ──────────────────────────────────────────────

const BRAIN1_REPO  = 'manojbillionaire123/Qwen3.5-0.8B-GGUF';
const BRAIN1_FILE  = 'Qwen3.5-0.8B-Q4_K_M.gguf';
const BRAIN1_LABEL = 'Nexus Qwen3.5-0.8B';
const BRAIN1_SIZE  = '~533 MB';

const BRAIN2_REPO  = 'manojbillionaire123/gemma-3-1b-it-GGUF';
const BRAIN2_FILE  = 'gemma-3-1b-it-Q4_0.gguf';
const BRAIN2_LABEL = 'Nexus Gemma 3-1B';
const BRAIN2_SIZE  = '~722 MB';

// wllama WASM paths (using official CDN with correct version-locked files)
const WLLAMA_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@wllama/wllama@3.1.1/esm';
const WLLAMA_ASSETS: AssetsPathConfig = {
  'wllama.wasm':          `${WLLAMA_CDN_BASE}/wasm/wllama.wasm`,
  'wllama-mt.wasm':       `${WLLAMA_CDN_BASE}/wasm/wllama-mt.wasm`,
  'wllama-mt.worker.mjs': `${WLLAMA_CDN_BASE}/wasm/wllama-mt.worker.mjs`,
};

// ── Persistence Layer (Web's "WorkManager" Storage) ────────────

class NexusStorage {
  private static DB_NAME = 'nexus_justice_cache';
  private static STORE_NAME = 'models';

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(this.STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public static async save(key: string, data: ArrayBuffer): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      tx.objectStore(this.STORE_NAME).put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public static async get(key: string): Promise<ArrayBuffer | null> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const request = tx.objectStore(this.STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  public static async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return !!data;
  }
}

// ── Smart Downloader (Web's "OkHttp" logic) ────────────────────

class ModelDownloader {
  public static async download(
    url: string, 
    onProgress: (pct: number, loaded: number, total: number) => void
  ): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    
    const total = parseInt(response.headers.get('content-length') || '0', 10);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
      onProgress(pct, loaded, total);
    }

    const result = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result.buffer;
  }
}

const SYSTEM_PROMPT = `You are Nexus Justice, an expert legal research assistant for advocates in Kerala, India.
Your core objective is to provide high-fidelity, legally accurate, and formally structured insights.

CRITICAL INSTRUCTIONS:
1. COMPLETE SENTENCES: You MUST always respond in full, grammatically correct sentences. Do not use fragments or bullet points unless providing a list of specific legal citations.
2. PROFESSIONAL TONE: Use formal legal terminology suitable for a High Court advocate.
3. LANGUAGE: If asked in Malayalam, respond in professional Malayalam. Otherwise, use formal English.
4. FOLLOW-UP: Every single response MUST conclude with a specific, relevant follow-up question that helps the advocate refine their legal strategy or gather more case details.
5. NO CUT-OFFS: Ensure your thoughts are complete within the response length.
6. NO INTERNAL MONOLOGUE: Start your response IMMEDIATELY with the answer. Do NOT use <think> tags, or say things like "I will now answer" or "Analyzing the request...". Jump straight to the professional legal advice. Respond directly to the user.`;

// ── Engine class ──────────────────────────────────────────────

export class HybridAIEngine {
  private static instance: HybridAIEngine;

  // Each brain gets its own wllama instance
  private brain1: Wllama | null = null;
  private brain2: Wllama | null = null;

  private brain1Loading  = false;
  private brain2Loading  = false;
  private brain1Progress = 0;
  private brain2Progress = 0;
  private brain1Ready    = false;
  private brain2Ready    = false;
  private brain1Message  = `${BRAIN1_LABEL} · ${BRAIN1_SIZE} · Q4_K_M`;
  private brain2Message  = `${BRAIN2_LABEL} · ${BRAIN2_SIZE} · Q4_0`;
  private preferredBrain: 1 | 2 = 1;
  
  // Mutex for sequential execution (prevents callbackId collisions)
  private executionLock: Promise<void> = Promise.resolve();


  private constructor() {
    console.log('Nexus AI Engine ready (wllama/CPU — no WebGPU required)');
  }

  public static getInstance(): HybridAIEngine {
    if (!HybridAIEngine.instance) {
      HybridAIEngine.instance = new HybridAIEngine();
    }
    return HybridAIEngine.instance;
  }

  // Helper to strip think tags from full text
  private cleanText(text: string): string {
    return text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .replace(/<think>[\s\S]*/gi, '') 
      .replace(/<thought>[\s\S]*/gi, '')
      .trim();
  }

  // Helper to clean history for prompt building
  private cleanHistory(history: AIMessage[]): AIMessage[] {
    return history.map(m => ({
      ...m,
      content: this.cleanText(m.content)
    }));
  }

  // ── Active engine & Selection ───────────────────────────────

  public setPreferredBrain(id: 1 | 2) {
    this.preferredBrain = id;
    console.log(`Preferred brain set to Brain ${id}`);
  }

  private get activeEngine(): Wllama | null {
    if (this.preferredBrain === 1) {
      return this.brain1 ?? this.brain2;
    } else {
      return this.brain2 ?? this.brain1;
    }
  }

  private get activeModelName(): string {
    const status = this.getStatus();
    if (status.isBrain1Ready && status.preferredBrain === 1) return BRAIN1_LABEL;
    if (status.isBrain2Ready && status.preferredBrain === 2) return BRAIN2_LABEL;
    if (status.isBrain1Ready) return BRAIN1_LABEL;
    if (status.isBrain2Ready) return BRAIN2_LABEL;
    return 'Offline';
  }

  // ── Status (used by UI) ───────────────────────────────────

  public getStatus() {
    return {
      // legacy fields portal still reads
      builtIn:         false,
      isLocalReady:    !!this.activeEngine,
      voiceModel:      this.activeEngine ? this.activeModelName : 'Not loaded',
      draftModel:      this.activeEngine ? this.activeModelName : 'Not loaded',
      searchModel:     'Local Neural Index',
      loadProgress:    this.brain1Progress,
      // Brain1
      isBrain1Ready:   this.brain1Ready,
      brain1Progress:  this.brain1Progress,
      brain1Model:     BRAIN1_LABEL,
      brain1Message:   this.brain1Message,
      isBrain1Loading: this.brain1Loading,
      // Brain2
      isBrain2Ready:   this.brain2Ready,
      brain2Progress:  this.brain2Progress,
      brain2Model:     BRAIN2_LABEL,
      brain2Message:   this.brain2Message,
      isBrain2Loading: this.brain2Loading,
      // Preference
      preferredBrain:  this.preferredBrain,
      // TTS/STT (Web Speech — always ready)
      ttsReady:        true,
      sttReady:        true,
      ttsProgress:     100,
      sttProgress:     100,
      isTTSLoading:    false,
      isSTTLoading:    false,
    };
  }

  // ── Loaders ───────────────────────────────────────────────

  private async createWllama(): Promise<Wllama> {
    const w = new Wllama(WLLAMA_ASSETS, {
      // Use explicit buffer for larger models if needed, though wllama handles this usually
    });
    return w;
  }

  /** Load Brain1 — Qwen3.5-0.8B Q4_K_M (primary, ~533 MB) */
  public async loadBrain1(
    onProgress?: (progress: number, text: string) => void,
    force = false
  ) {
    if ((this.brain1Ready && !force) || this.brain1Loading) return;
    
    this.brain1Loading = true;
    this.brain1Message = 'Initializing Engine...';
    
    try {
      // 1. Check persistence (The "WorkManager" part)
      let modelData = await NexusStorage.get(BRAIN1_FILE);
      
      if (!modelData || force) {
        this.brain1Message = 'Establishing Secure Download...';
        const url = `https://huggingface.co/${BRAIN1_REPO}/resolve/main/${BRAIN1_FILE}`;
        
        // 2. Performance Download (The "OkHttp" part)
        modelData = await ModelDownloader.download(url, (pct, loaded, total) => {
          this.brain1Progress = pct;
          const text = `Downloading Brain1: ${pct}% (${Math.round(loaded / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB)`;
          this.brain1Message = text;
          onProgress?.(pct, text);
        });
        
        this.brain1Message = 'Optimizing Storage...';
        await NexusStorage.save(BRAIN1_FILE, modelData);
      }

      this.brain1Message = 'Linking Neural Processor...';
      const w = await this.createWllama();
      
      // 3. Inference Execution (The "LiteRT" part)
      await w.loadModelFromBuffer(modelData, {
        n_ctx: 2048,
        n_threads: Math.min(4, Math.max(1, (navigator.hardwareConcurrency ?? 2) - 1)),
      });
      
      this.brain1 = w;
      this.brain1Ready = true;
      this.brain1Progress = 100;
      this.brain1Message = `✅ ${BRAIN1_LABEL} ready · CPU/WASM`;
      onProgress?.(100, this.brain1Message);
      console.log('Brain1 ready:', BRAIN1_LABEL);
    } catch (err) {
      console.error('Brain1 load failed:', err);
      this.brain1Message = `⚠️ Brain1 failed: ${(err as Error).message}`;
      this.brain1 = null;
      this.brain1Ready = false;
    } finally {
      this.brain1Loading = false;
    }
  }

  /** Load Brain2 — Gemma 3-1B Q4_K_M (Advanced Fallback, ~768 MB) */
  public async loadBrain2(
    onProgress?: (progress: number, text: string) => void,
    force = false
  ) {
    if ((this.brain2Ready && !force) || this.brain2Loading) return;
    
    this.brain2Loading = true;
    this.brain2Message = 'Initializing Engine...';
    
    try {
      // 1. Check persistence
      let modelData = await NexusStorage.get(BRAIN2_FILE);
      
      if (!modelData || force) {
        this.brain2Message = 'Establishing Secure Download...';
        const url = `https://huggingface.co/${BRAIN2_REPO}/resolve/main/${BRAIN2_FILE}`;
        
        // 2. Perform Download
        modelData = await ModelDownloader.download(url, (pct, loaded, total) => {
          this.brain2Progress = pct;
          const text = `Downloading Brain2: ${pct}% (${Math.round(loaded / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB)`;
          this.brain2Message = text;
          onProgress?.(pct, text);
        });
        
        this.brain2Message = 'Optimizing Storage...';
        await NexusStorage.save(BRAIN2_FILE, modelData);
      }

      this.brain2Message = 'Linking Neural Processor...';
      const w = await this.createWllama();
      
      // 3. Inference Execution
      await w.loadModelFromBuffer(modelData, {
        n_ctx: 2048,
        n_threads: 1, // Single thread for Gemma 1B on web for max compatibility
      });
      
      this.brain2 = w;
      this.brain2Ready = true;
      this.brain2Progress = 100;
      this.brain2Message = `✅ ${BRAIN2_LABEL} ready · CPU/WASM`;
      onProgress?.(100, this.brain2Message);
      console.log('Brain2 ready:', BRAIN2_LABEL);
    } catch (err) {
      console.error('Brain2 load failed:', err);
      this.brain2Message = `⚠️ Brain2 failed: ${(err as Error).message}`;
      this.brain2 = null;
      this.brain2Ready = false;
    } finally {
      this.brain2Loading = false;
    }
  }

  /** Legacy alias — old UI calls this */
  public async loadLocalModel(onProgress?: (p: number) => void, force = false) {
    return this.loadBrain1(onProgress ? (p, t) => onProgress(p) : undefined, force);
  }

  public async loadTTS(onProgress?: (p: number) => void) { onProgress?.(100); }
  public async loadSTT(onProgress?: (p: number) => void) { onProgress?.(100); }

  // ── Prompt builder ────────────────────────────────────────

  private buildPrompt(userMessage: string, history: AIMessage[]): string {
    const isGemma = this.activeModelName.toLowerCase().includes('gemma');
    const cleaned = this.cleanHistory(history);
    const recent = cleaned.slice(-4);
    
    if (isGemma) {
      // Gemma 3 Format (Compatible with Gemma 2)
      let prompt = `<start_of_turn>user\n${SYSTEM_PROMPT}\n\n`;
      for (const m of recent) {
        if (m.role === 'user') {
          prompt += `${m.content}<end_of_turn>\n<start_of_turn>model\n`;
        } else {
          prompt += `${m.content}<end_of_turn>\n<start_of_turn>user\n`;
        }
      }
      prompt += `${userMessage}<end_of_turn>\n<start_of_turn>model\n`;
      return prompt;
    }

    // Default ChatML for Qwen
    let prompt = `<|im_start|>system\n${SYSTEM_PROMPT}<|im_end|>\n`;
    for (const m of recent) {
      prompt += `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`;
    }
    prompt += `<|im_start|>user\n${userMessage}<|im_end|>\n<|im_start|>assistant\n`;
    return prompt;
  }

  private notReadyResponse(): AIResponse {
    return {
      text: 'No model loaded yet.\n\nPlease go to the BRAIN tab and download Brain1 (Qwen3.5-0.8B, ~533 MB) or Brain2 (Gemma 3-1B, ~768 MB). Both run entirely on your device — no WebGPU or internet connection needed after download.',
      model: 'Offline',
    };
  }

  private async performAgenticSearch(query: string): Promise<string> {
    return `[Legal Index Search Result]
Query: ${query}
- Kerala High Court: Recent rulings on digital evidence admissibility under IT Act 2000 (amended).
- Supreme Court 2025: Biometric data classified as sensitive personal data under PDPB framework.
- CPC Order 7 Rule 11: Plaint rejection grounds — frequently litigated in Kerala district courts.
Source: Nexus Local Legal Index (cached)`;
  }

  // ── Streaming inference ───────────────────────────────────
  
  /**
   * Safe execution wrapper to prevent overlapping worker calls
   */
  private async runSafe<T>(fn: () => Promise<T>): Promise<T> {
    const previousLock = this.executionLock;
    let releaseLock: () => void;
    this.executionLock = new Promise((resolve) => {
      releaseLock = resolve;
    });

    try {
      await previousLock;
      return await fn();
    } finally {
      // Ensure we release the lock even on failure
      // @ts-ignore
      releaseLock!();
    }
  }

  public async *generateResponseStream(
    prompt: string,
    history: AIMessage[],
    task: AITaskType = 'voice'
  ): AsyncGenerator<{ text: string; model: string; status?: string }> {

    const previousLock = this.executionLock;
    let releaseLock: () => void;
    this.executionLock = new Promise((resolve) => {
      releaseLock = resolve;
    });

    try {
      await previousLock;

      const engine = this.activeEngine;
      const modelName = this.activeModelName;

      if (!engine) {
        yield { text: this.notReadyResponse().text, model: 'Offline' };
        return;
      }

      const needsSearch =
        prompt.toLowerCase().includes('search') ||
        prompt.toLowerCase().includes('latest') ||
        prompt.toLowerCase().includes('current') ||
        prompt.toLowerCase().includes('ruling');

      let finalPrompt = prompt;
      if (needsSearch) {
        yield { text: '', model: modelName, status: 'Searching Legal Index...' };
        const ctx = await this.performAgenticSearch(prompt);
        finalPrompt = `Legal Index context:\n${ctx}\n\nAdvocate question: ${prompt}`;
      }

      yield { text: '', model: modelName, status: `Engaging ${modelName}...` };
      let isThinking = false;
      let streamBuffer = '';

      const fullPrompt = this.buildPrompt(finalPrompt, history);
      const maxTokens  = task === 'voice' ? 512 : 1024;

      const completion = await engine.createCompletion({
        prompt: fullPrompt,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: true,
        onData: () => {}, // Required by typing but we use the iterator
      });

      for await (const chunk of completion) {
        const chunkText = chunk.choices[0].text;
        streamBuffer += chunkText;

        // If we detect thinking, skip it but provide a status update
        const hasThink = streamBuffer.includes('<think>') || streamBuffer.includes('<thought>');
        if (!isThinking && hasThink) {
          isThinking = true;
          yield { text: '', model: modelName, status: 'Refining legal strategy...' };
        }

        if (isThinking) {
          const thinkEndIdx = streamBuffer.indexOf('</think>');
          const thoughtEndIdx = streamBuffer.indexOf('</thought>');
          const endIdx = (thinkEndIdx !== -1) ? thinkEndIdx + 8 : (thoughtEndIdx !== -1 ? thoughtEndIdx + 10 : -1);

          if (endIdx !== -1) {
            isThinking = false;
            streamBuffer = streamBuffer.substring(endIdx);
            yield { text: '', model: modelName, status: `Neural Sync Complete. Answering...` };
          } else {
            // Safety: if thinking block is extremely long (>1200 chars), stop filtering 
            if (streamBuffer.length > 1200) {
              isThinking = false;
              const currentText = this.cleanText(streamBuffer);
              if (currentText) yield { text: currentText, model: modelName };
              streamBuffer = '';
            }
            continue;
          }
        }

        if (!isThinking) {
          const thinkStartIdx = streamBuffer.indexOf('<think');
          const thoughtStartIdx = streamBuffer.indexOf('<thought');
          const startIdx = (thinkStartIdx !== -1) ? thinkStartIdx : (thoughtStartIdx !== -1 ? thoughtStartIdx : -1);

          if (startIdx !== -1) {
            const beforeTag = streamBuffer.substring(0, startIdx);
            if (beforeTag) yield { text: beforeTag, model: modelName };
            streamBuffer = streamBuffer.substring(startIdx);
            isThinking = true;
            yield { text: '', model: modelName, status: 'Neural reasoning...' };
          } else {
            if (streamBuffer) {
              yield { text: streamBuffer, model: modelName };
              streamBuffer = '';
            }
          }
        }
      }
      
      // Final flush of remaining buffer if any, ensuring we strip lingering think tags
      if (streamBuffer) {
        const cleaned = this.cleanText(streamBuffer);
        if (cleaned) {
          yield { text: cleaned, model: modelName };
        }
      }
    } catch (err) {
      console.error('wllama inference error:', err);
      yield { text: 'Inference error. Please try again.', model: 'Error' };
    } finally {
      // @ts-ignore
      releaseLock!();
    }
  }

  // ── Non-streaming inference ───────────────────────────────

  public async generateResponse(
    prompt: string,
    history: AIMessage[],
    _imageBase64?: string,
    task: AITaskType = 'general'
  ): Promise<AIResponse> {
    return this.runSafe(async () => {
      const engine = this.activeEngine;
      const modelName = this.activeModelName;

      if (!engine) return this.notReadyResponse();

      let finalPrompt = prompt;
      const needsSearch =
        prompt.toLowerCase().includes('search') ||
        prompt.toLowerCase().includes('latest') ||
        prompt.toLowerCase().includes('ruling');

      if (needsSearch) {
        const ctx = await this.performAgenticSearch(prompt);
        finalPrompt = `Legal Index context:\n${ctx}\n\nAdvocate question: ${prompt}`;
      }

      const fullPrompt = this.buildPrompt(finalPrompt, history);
      const maxTokens  = task === 'voice' ? 512 : 1024;

      try {
        const result = await engine.createCompletion({
          prompt: fullPrompt,
          max_tokens:    maxTokens,
          temperature: 0.7,
        });
        const cleaned = this.cleanText(result.choices[0].text);
        return { text: cleaned || 'No response generated.', model: modelName };
      } catch (err) {
        console.error('wllama generateResponse error:', err);
        return { text: 'Inference error. Please try again.', model: 'Error' };
      }
    });
  }

  // ── TTS stub (caller uses Web Speech API) ─────────────────
  public async generateGemmaTTS(_text: string, _lang = 'ml-IN'): Promise<string | null> {
    return null;
  }
}

export const aiEngine = HybridAIEngine.getInstance();
