/**
 * MalayalamEngine
 * STT  → Web Speech API (SpeechRecognition, built into Chrome/Edge)
 * TTS  → Web Speech API (SpeechSynthesis) with ml-IN / en-IN fallback
 *
 * @xenova/transformers dependency removed entirely.
 */

export class MalayalamEngine {
  private static instance: MalayalamEngine;

  // Web Speech API handles loading lazily — no pre-load needed
  private ttsReady   = typeof window !== "undefined" && "speechSynthesis" in window;
  private sttReady   = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  private ttsProgress = this.ttsReady ? 100 : 0;
  private sttProgress = this.sttReady ? 100 : 0;

  private constructor() {}

  public static getInstance(): MalayalamEngine {
    if (!MalayalamEngine.instance) {
      MalayalamEngine.instance = new MalayalamEngine();
    }
    return MalayalamEngine.instance;
  }

  public getStatus() {
    return {
      ttsReady:     this.ttsReady,
      sttReady:     this.sttReady,
      ttsProgress:  this.ttsProgress,
      sttProgress:  this.sttProgress,
      isTTSLoading: false,
      isSTTLoading: false,
    };
  }

  /** No-op — Web Speech API needs no pre-loading */
  public async loadTTS(onProgress?: (progress: number) => void) {
    if (onProgress) onProgress(100);
  }

  /** No-op — Web Speech API needs no pre-loading */
  public async loadSTT(onProgress?: (progress: number) => void) {
    if (onProgress) onProgress(100);
  }

  /**
   * Speak text using Web Speech API.
   * Tries ml-IN voice first, falls back to en-IN, then any available voice.
   */
  public async speak(text: string): Promise<AudioBuffer | null> {
    if (!this.ttsReady) {
      console.warn("SpeechSynthesis not supported in this browser.");
      return null;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const mlVoice  = voices.find(v => v.lang === "ml-IN");
        const enVoice  = voices.find(v => v.lang === "en-IN");
        utterance.voice = mlVoice ?? enVoice ?? voices[0] ?? null;
        utterance.lang  = mlVoice ? "ml-IN" : "en-IN";
        utterance.rate  = 0.95;
        utterance.pitch = 1.0;

        utterance.onend   = () => resolve(null);
        utterance.onerror = (e) => {
          console.error("SpeechSynthesis error:", e);
          resolve(null);
        };

        window.speechSynthesis.cancel(); // clear queue
        window.speechSynthesis.speak(utterance);
      };

      // Voices may not be ready on first call
      if (window.speechSynthesis.getVoices().length > 0) {
        trySpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          trySpeak();
        };
      }
    });
  }

  /**
   * Transcribe speech using Web Speech API.
   * Returns the transcript string or null on failure.
   */
  public async transcribe(
    _audio: any,
    lang: string = "ml-IN"
  ): Promise<string | null> {
    if (!this.sttReady) {
      console.warn("SpeechRecognition not supported in this browser.");
      return null;
    }

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const recognition: any = new SR();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    return new Promise((resolve) => {
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? null;
        resolve(transcript);
      };
      recognition.onerror = (e) => {
        console.error("SpeechRecognition error:", e);
        resolve(null);
      };
      recognition.onend = () => resolve(null);
      recognition.start();
    });
  }

  /**
   * Record audio from microphone (raw Float32Array for compatibility).
   * Used by callers that pass audio into transcribe().
   */
  public async recordAudio(durationMs: number = 5000): Promise<Float32Array | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];

      return new Promise((resolve) => {
        processor.onaudioprocess = (e) => {
          chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        };
        source.connect(processor);
        processor.connect(audioContext.destination);

        setTimeout(() => {
          stream.getTracks().forEach(t => t.stop());
          processor.disconnect();
          source.disconnect();
          audioContext.close();

          const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
          const result = new Float32Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
          resolve(result);
        }, durationMs);
      });
    } catch (error) {
      console.error("Audio Recording Error:", error);
      return null;
    }
  }
}
