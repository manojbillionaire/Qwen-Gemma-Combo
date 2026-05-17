import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Mic, Camera, FileText, Users, Bell, HelpCircle, 
  BookOpen, Edit3, Layout, MessageSquare, Settings, 
  Download, Globe, Wifi, WifiOff, Shield, Save, Trash2,
  ChevronLeft, ChevronRight, Play, Square, Copy, ExternalLink,
  CheckCircle, AlertTriangle, Info, X, Search, Plus, RotateCcw,
  Volume2, Send, Trash, Check, AlertCircle, LogOut, Upload, File,
  Maximize2, Minimize2, Cpu, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import { VoiceVisualizer } from './VoiceVisualizer';
import { HybridAIEngine, AIMessage, AIResponse } from "../lib/ai-engine";
import { MalayalamEngine } from "../lib/malayalam-engine";
import { LocalDB } from "../lib/local-db";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

// --- Custom Icon Component ---
const Icon = ({ path, size = 20, strokeWidth = 2, style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(path) ? path.map((d: string, i: number) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

// --- Constants ---
const SIMULATED_CALLS = [
  {
    id: 1,
    clientName: "John Doe",
    phone: "+1 555-0123",
    timestamp: "2026-03-24 10:30 AM",
    duration: "5m 12s",
    transcript: [
      { role: "client", text: "Hello Advocate, I have a property dispute with my brother over our ancestral land in the village." },
      { role: "advocate", text: "I understand. Do you have the title deeds and the family tree document?" },
      { role: "client", text: "Yes, I have all the documents ready." }
    ],
    summary: "Property dispute over ancestral land. Needs to file a partition suit. Documents ready."
  },
  {
    id: 2,
    clientName: "Elena Rodriguez",
    phone: "+1 555-0199",
    timestamp: "2026-03-23 02:15 PM",
    duration: "2m 45s",
    transcript: [
      { role: "client", text: "Advocate, I received a notice from the cooperative society regarding my membership. They are saying I haven't paid the maintenance for 6 months, but I have the receipts." },
      { role: "advocate", text: "Please send me the receipts and the notice. We can reply to them under the Cooperative Societies Act." }
    ],
    summary: "Cooperative society membership notice. Maintenance payment dispute. Client has receipts."
  },
  {
    id: 3,
    clientName: "Sarah Smith",
    phone: "+1 555-0456",
    timestamp: "2026-03-22 11:00 AM",
    duration: "3m 20s",
    transcript: [
      { role: "client", text: "I'm starting a new job and I want you to review the employment contract, especially the non-compete clause." },
      { role: "advocate", text: "Sure, send it over. I'll check if the clause is reasonable and enforceable in your jurisdiction." }
    ],
    summary: "Employment contract review. Non-compete clause concerns. Needs legal opinion."
  }
];

const sideNav = [
  { id: 'command', label: 'Command', icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
  { id: 'feed', label: 'Feed', icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
  { id: 'consult', label: 'Consult', icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" },
  { id: 'clients', label: 'Clients', icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: 'knowledge', label: 'Knowledge', icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: 'instructions', label: 'Instructions', icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { id: 'drafting', label: 'Drafting', icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
  { id: 'notif', label: 'Notifications', icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { id: 'support', label: 'Support', icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: 'read', label: 'Read', icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: 'convert', label: 'Convert', icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { id: 'models', label: 'BRAIN', icon: "M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2zm0 4h16m-16 4h16" },
  { id: 'brain2', label: 'BRAINS', icon: "M9.5 2a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm5 0a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM5 9.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm14 0a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM9.5 17a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm5 0a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" },
];

const topTabs = [
  { id: 'command', label: 'COMMAND' },
  { id: 'feed', label: 'FEED' },
  { id: 'consult', label: 'CONSULT' },
  { id: 'clients', label: 'CLIENTS' },
  { id: 'knowledge', label: 'KNOWLEDGE' },
  { id: 'instructions', label: 'INSTRUCTIONS' },
  { id: 'drafting', label: 'DRAFTING' },
  { id: 'notif', label: 'NOTIF.' },
  { id: 'support', label: 'SUPPORT' },
  { id: 'read', label: 'READ' },
  { id: 'convert', label: 'CONVERT' },
  { id: 'models', label: 'BRAIN' },
  { id: 'brain2', label: 'BRAINS' },
];

const CONVERTER_STEPS = [
  { id: 1, title: 'Camera Capture', desc: 'Snap photos of physical documents', icon: <Camera size={14} />, color: '#6366f1' },
  { id: 2, title: 'File Upload', desc: 'Select images from your device', icon: <Upload size={14} />, color: '#10b981' },
  { id: 3, title: 'AI Extraction', desc: 'High-precision text recognition', icon: <Search size={14} />, color: '#f59e0b' },
  { id: 4, title: 'AI Translation', desc: 'Convert to any language', icon: <Globe size={14} />, color: '#8b5cf6' },
  { id: 5, title: 'PDF Export', desc: 'Save as professional PDF', icon: <FileText size={14} />, color: '#ef4444' },
  { id: 6, title: 'Word Export', desc: 'Save as editable .docx', icon: <File size={14} />, color: '#3b82f6' },
];

const S = {
  page: { display: 'flex', height: '100vh', background: '#020617', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', fontSize: 14 },
  sidebar: { width: 72, background: '#070b14', borderRight: '1px solid rgba(255,255,255,.05)', display: 'flex' as const, flexDirection: 'column' as const, alignItems: 'center', padding: '0', gap: 8, flexShrink: 0, overflowY: 'auto' as const },
  sideBtn: (active: boolean) => ({ width: '100%', height: 56, background: active ? 'rgba(245,158,11,.05)' : 'transparent', border: 'none', color: active ? '#f59e0b' : '#475569', cursor: 'pointer', display: 'flex' as const, alignItems: 'center', justifyContent: 'center', position: 'relative' as const, transition: 'all .2s', flexShrink: 0 }),
  header: { height: 64, background: '#0a0f1d', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 },
  card: { background: 'rgba(10,15,29,0.7)', borderRadius: 24, padding: 24, border: '1px solid rgba(255,255,255,.05)', backdropFilter: 'blur(10px)' },
};

const NeuralFlow = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/10" />
    <svg className="absolute w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <motion.path
        d="M0,500 Q250,400 500,500 T1000,500"
        stroke="rgba(99, 102, 241, 0.2)"
        strokeWidth="2"
        fill="none"
        animate={{
          d: [
            "M0,500 Q250,400 500,500 T1000,500",
            "M0,500 Q250,600 500,500 T1000,500",
            "M0,500 Q250,400 500,500 T1000,500"
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M0,600 Q250,500 500,600 T1000,600"
        stroke="rgba(245, 158, 11, 0.1)"
        strokeWidth="1"
        fill="none"
        animate={{
          d: [
            "M0,600 Q250,500 500,600 T1000,600",
            "M0,600 Q250,700 500,600 T1000,600",
            "M0,600 Q250,500 500,600 T1000,600"
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </svg>
  </div>
);

export default function AdvocatePortal({ onBack }: { onBack: () => void }) {
  const [connectionType, setConnectionType] = useState<'wifi' | 'mobile' | 'unknown'>('unknown');
  const [view, setView] = useState("command");
  const [aiStatus, setAiStatus] = useState<any>({});
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Connectivity Monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setVoiceAiStatus("System Online");
      setVoiceAiTranscript("Internet connection restored.");
    };
    const handleOffline = () => {
      setIsOffline(true);
      setVoiceAiStatus("Offline Mode");
      setVoiceAiTranscript("Internet connection lost. Some features limited.");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Doc Converter State
  const [converterImage, setConverterImage] = useState<string | null>(null);
  const [converterText, setConverterText] = useState('');
  const [converterStatus, setConverterStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPreviewEnlarged, setIsPreviewEnlarged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiEngine = HybridAIEngine.getInstance();
  const localDB = LocalDB.getInstance();

  const [clients, setClients] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<AIMessage[]>([]);
  const [consoleInput, setConsoleInput] = useState("");
  const [consoleLoading, setConsoleLoading] = useState(false);
  
  const [scanPhase, setScanPhase] = useState<'idle' | 'starting' | 'live' | 'processing' | 'done' | 'error'>('idle');
  const [scannedText, setScannedText] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [draftPages, setDraftPages] = useState(["IN THE COURT OF THE DISTRICT JUDGE...\n\n[Drafting starts here]"]);
  const [deskInput, setDeskInput] = useState('');
  const [deskLoading, setDeskLoading] = useState(false);
  const [deskChatHistory, setDeskChatHistory] = useState<any[]>([
    { role: 'ai', text: "Welcome to the Writing Desk. I can help you draft petitions and plaints." }
  ]);

  const [draftFacts, setDraftFacts] = useState('');
  const [draftModel, setDraftModel] = useState('');
  const [draftSuggestions, setDraftSuggestions] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [enlargedElement, setEnlargedElement] = useState<'facts' | 'model' | 'pad' | null>(null);
  const enlargedElementRef = useRef(enlargedElement);
  useEffect(() => { enlargedElementRef.current = enlargedElement; }, [enlargedElement]);

  const [voiceAiOn, setVoiceAiOn] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'ml-IN'>('en-US');
  const [voiceAiTranscript, setVoiceAiTranscript] = useState("");
  const [voiceAiReply, setVoiceAiReply] = useState("");
  const [voiceAiStatus, setVoiceAiStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | string>('idle');
  const [voiceHistory, setVoiceHistory] = useState<AIMessage[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const voiceAiOnRef = useRef(false);
  const voiceAiStatusRef = useRef<'idle' | 'listening' | 'thinking' | 'speaking' | string>('idle');

  // Sync refs with state
  useEffect(() => { voiceAiOnRef.current = voiceAiOn; }, [voiceAiOn]);
  useEffect(() => { voiceAiStatusRef.current = voiceAiStatus; }, [voiceAiStatus]);

  // Restart voice AI when language changes
  useEffect(() => {
    if (voiceAiOn && voiceAiStatus === 'listening') {
      startVoiceAi();
    }
  }, [voiceLang]);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Gemma 4 E2B Download State
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSlice, setDownloadSlice] = useState(0); // 0: none, 1: complete
  const [downloadMessage, setDownloadMessage] = useState('Nexus Justice Smart Download Active.');

  // Brain1 — Qwen3.5-0.8B Q4_K_M (primary)
  const [brain1Progress, setBrain1Progress] = useState(0);
  const [isBrain1Downloading, setIsBrain1Downloading] = useState(false);
  const [brain1Message, setBrain1Message] = useState('Nexus Qwen3.5-0.8B · ~533 MB · Q4_K_M · Works on any phone');
  const [brain1Ready, setBrain1Ready] = useState(false);
  // Brain2 — Qwen3.5-0.8B Q3_K_M (lighter fallback)
  const [brain2Progress, setBrain2Progress] = useState(0);
  const [isBrain2Downloading, setIsBrain2Downloading] = useState(false);
  const [brain2Message, setBrain2Message] = useState('Nexus Gemma 3-1B · ~722 MB · Q4_0 · High compatibility');
  const [brain2Ready, setBrain2Ready] = useState(false);
  const [preferredBrain, setPreferredBrain] = useState<1 | 2>(1);

  const [showCompatibilityBanner, setShowCompatibilityBanner] = useState(true);
  const [browserCompatibility, setBrowserCompatibility] = useState<{isCompatible: boolean, message: string}>({
    isCompatible: true,
    message: ''
  });

  useEffect(() => {
    const checkCompatibility = async () => {
      // @ts-ignore - Chrome built-in AI API
      const ai = (window as any).ai;
      if (!ai || !ai.languageModel) {
        setBrowserCompatibility({
          isCompatible: false,
          message: "🔒 High-Privacy Active: Local Gemma 4 Neural Core is managing all legal research. All data remains strictly on-device."
        });
      }
    };
    checkCompatibility();
  }, []);

  // Malayalam Model States
  const [malayalamStatus, setMalayalamStatus] = useState({
    ttsReady: false,
    sttReady: false,
    ttsProgress: 0,
    sttProgress: 0,
    isTTSLoading: false,
    isSTTLoading: false
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const gemmaAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const watchdogTimerRef = useRef<any>(null);
  const sentenceQueueRef = useRef<string[]>([]);
  const isSpeakingQueueRef = useRef(false);
  const speechFinishedIntervalRef = useRef<any>(null);

  const startMicLevelMonitoring = async () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { await audioContextRef.current.close(); } catch(e) {}
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!voiceAiOnRef.current || !analyserRef.current) {
          if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
          }
          return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setMicLevel(average);
        requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      console.error("Mic level monitoring error:", err);
    }
  };

  const startSTTWatchdog = () => {
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    watchdogTimerRef.current = setTimeout(() => {
      if (voiceAiOnRef.current && voiceAiStatusRef.current === 'listening') {
        console.warn("STT watchdog triggered: No results for 10s. Restarting...");
        startVoiceAi();
      }
    }, 10000);
  };

  const startLocalMalayalamSTT = async () => {
    setVoiceAiOn(true);
    setVoiceAiStatus('listening');
    setVoiceAiTranscript("Local STT Active (Malayalam)...");
    
    try {
      const audio = await MalayalamEngine.getInstance().recordAudio(5000);
      if (audio && voiceAiOnRef.current) {
        setVoiceAiStatus('thinking');
        const text = await MalayalamEngine.getInstance().transcribe(audio);
        if (text && voiceAiOnRef.current) {
          setVoiceAiTranscript(text);
          processVoiceCommand(text);
        } else if (voiceAiOnRef.current) {
          startLocalMalayalamSTT(); // Restart if no text
        }
      }
    } catch (err) {
      console.error("Local STT Error:", err);
      setVoiceAiOn(false);
    }
  };

  const startVoiceAi = async () => {
    if (!navigator.onLine) {
      if (voiceLang === 'ml-IN' && malayalamStatus.sttReady) {
        startLocalMalayalamSTT();
        return;
      }
      setVoiceAiStatus("Offline: STT requires internet.");
      setVoiceAiTranscript("Voice recognition is currently unavailable offline.");
      setVoiceAiOn(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Ensure we are starting fresh and the previous instance is fully disposed
    if (recognitionRef.current) {
      const old = recognitionRef.current;
      old.onend = null;
      old.onresult = null;
      old.onerror = null;
      old.onstart = null;
      try { old.stop(); } catch(e) {}
      recognitionRef.current = null;
      // Brief pause to allow the browser to release the audio device
      await new Promise(r => setTimeout(r, 200));
    }

    // Check for microphone permission explicitly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // We don't need to keep the stream, SpeechRecognition will manage its own
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access denied or not available. Please check your browser settings.");
      setVoiceAiOn(false);
      return;
    }

    setVoiceAiOn(true);
    setVoiceAiStatus('listening');
    setVoiceAiTranscript("Listening...");
    setVoiceAiReply("");
    startMicLevelMonitoring();
    startSTTWatchdog();

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Use false for better compatibility and more predictable onresult/onend
    recognition.interimResults = true;
    recognition.lang = voiceLang;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setVoiceAiStatus('listening');
    };

    recognition.onspeechstart = () => {
      console.log("Speech started - potential barge-in");
      if (voiceAiStatusRef.current === 'speaking' || voiceAiStatusRef.current === 'thinking') {
        console.log("User barge-in detected (speechstart), stopping AI output");
        window.speechSynthesis.cancel();
        if (gemmaAudioRef.current) {
          try { gemmaAudioRef.current.pause(); } catch(e) {}
          gemmaAudioRef.current = null;
        }
        // Clear speech queue
        sentenceQueueRef.current = [];
        isSpeakingQueueRef.current = false;
        if (speechFinishedIntervalRef.current) {
          clearInterval(speechFinishedIntervalRef.current);
          speechFinishedIntervalRef.current = null;
        }
        
        setVoiceAiStatus('listening');
        setVoiceAiReply("");
      }
    };

    recognition.onresult = (event: any) => {
      console.log("Speech recognition result received", event);
      
      // Barge-in logic: Stop AI speech if user starts talking
      if (voiceAiStatusRef.current === 'speaking' || voiceAiStatusRef.current === 'thinking') {
        console.log("User barge-in detected, stopping AI output");
        window.speechSynthesis.cancel();
        if (gemmaAudioRef.current) {
          try { gemmaAudioRef.current.pause(); } catch(e) {}
          gemmaAudioRef.current = null;
        }
        // Clear speech queue
        sentenceQueueRef.current = [];
        isSpeakingQueueRef.current = false;
        if (speechFinishedIntervalRef.current) {
          clearInterval(speechFinishedIntervalRef.current);
          speechFinishedIntervalRef.current = null;
        }
        
        setVoiceAiStatus('listening');
        setVoiceAiReply("");
      }

      // Only process if we are in listening mode
      if (voiceAiStatusRef.current !== 'listening') return;

      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      if (transcript) {
        console.log("Current transcript:", transcript);
        setVoiceAiTranscript(transcript);
        // Reset watchdog on result
        if (watchdogTimerRef.current) {
          clearTimeout(watchdogTimerRef.current);
          startSTTWatchdog();
        }
      }

      // Reset silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      // If the result is final, start the timer to process the command
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal && transcript.trim().length > 1) {
        console.log("Final transcript detected, starting silence timer");
        silenceTimerRef.current = setTimeout(() => {
          if (voiceAiStatusRef.current === 'listening') {
            processVoiceCommand(transcript.trim());
          }
        }, 1200); 
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        return; // onend handles restart silently
      }
      console.error("Speech Recognition Error:", event.error);
      const isMicSilent = micLevel < 5;
      
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please check your browser permissions.");
        stopVoiceAi();
      } else if (event.error === 'network') {
        setVoiceAiReply("Network error: Speech recognition requires an internet connection. Please check your network.");
        setTimeout(() => { if (voiceAiOnRef.current && voiceAiStatusRef.current === 'listening') startVoiceAi(); }, 2000);
      } else {
        // For other errors, try a clean restart after a delay
        if (isMicSilent && voiceAiStatusRef.current === 'listening') {
          console.warn("Mic seems silent during STT error. Check hardware.");
        }
        setTimeout(() => { if (voiceAiOnRef.current && voiceAiStatusRef.current === 'listening') startVoiceAi(); }, 1000);
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      // Clear watchdog on end
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      
      // If we are still in listening mode, it means it ended because continuous=false
      // We should restart it to keep listening for the next command
      if (voiceAiOnRef.current && voiceAiStatusRef.current === 'listening') {
        setTimeout(() => {
          if (voiceAiOnRef.current && voiceAiStatusRef.current === 'listening') {
            // Call startVoiceAi to get a fresh instance, which is more reliable
            startVoiceAi();
          }
        }, 300);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to start recognition:", e);
      // If it fails because it's already started, that's fine, but if it's another error, try restart
      if (!String(e).includes('already started')) {
        setTimeout(() => { if (voiceAiOn) startVoiceAi(); }, 500);
      }
    }
  };

  const stopVoiceAi = () => {
    setVoiceAiOn(false);
    setVoiceAiStatus('idle');
    setMicLevel(0);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (gemmaAudioRef.current) {
      gemmaAudioRef.current.pause();
      gemmaAudioRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    window.speechSynthesis.cancel();
  };

  // Doc Converter Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setConverterImage(event.target?.result as string);
      setConverterText('');
      setConverterStatus('idle');
    };
    reader.readAsDataURL(file);
  };

  const processConversion = async () => {
    if (!converterImage) return;
    setConverterStatus('processing');
    try {
      const response = await aiEngine.generateResponse(
        "Please extract all the text from this document for conversion into a formal document. Return only the text content.", 
        [], 
        converterImage,
        'drafting'
      );
      setConverterText(response.text);
      setConverterStatus('done');
    } catch (err) {
      console.error(err);
      setConverterStatus('idle');
    }
  };

  const exportToPDF = () => {
    if (!converterText) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(converterText, 180);
    doc.text(splitText, 10, 10);
    doc.save("converted_document.pdf");
  };

  const exportToWord = async () => {
    if (!converterText) return;
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun(converterText)],
          }),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "converted_document.docx");
  };

  const captureForConverter = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const imageBase64 = canvasRef.current.toDataURL('image/jpeg');
    setConverterImage(imageBase64);
    setConverterText('');
    setConverterStatus('idle');
  };

  const handleTranslate = async () => {
    if (!converterText || !targetLanguage) return;
    setIsTranslating(true);
    try {
      const response = await aiEngine.generateResponse(
        `Translate the following legal document text into ${targetLanguage}. Maintain the formal legal tone and formatting. Text: ${converterText}`,
        [],
        undefined,
        'drafting'
      );
      setTranslatedText(response.text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const processVoiceCommand = async (text: string) => {
    if (!text.trim() || text.trim().length < 2) {
      // If text is too short, just restart listening if it was stopped
      if (voiceAiOnRef.current && voiceAiStatusRef.current === 'listening') {
        setTimeout(() => {
          try { if (recognitionRef.current) recognitionRef.current.start(); } catch(e) {}
        }, 100);
      }
      return;
    }

    // Dictation mode for drafting facts
    if (enlargedElementRef.current === 'facts') {
      setDraftFacts(prev => prev + (prev.trim() ? " " : "") + text);
      setVoiceAiStatus('listening');
      if (voiceAiOnRef.current) {
        setTimeout(() => {
          try { if (recognitionRef.current) recognitionRef.current.start(); } catch(e) {}
        }, 100);
      }
      return;
    }
    
    // Stop recognition while AI is thinking/speaking to avoid echo
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    // Brain1 removed — Qwen3-0.6B (Brain2) is the only engine; proceed directly

    setVoiceAiStatus('thinking');
    setVoiceAiReply("Thinking...");
    
    // Automatically switch to Consult view as soon as a question is asked
    setView('consult');
    
    // Add user message to history immediately
    const userMsg: AIMessage = { role: 'user', content: text };
    const updatedHistory = [...voiceHistory, userMsg];
    setVoiceHistory(updatedHistory);
    setChatHistory(updatedHistory);

    // Watchdog for AI response
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    watchdogTimerRef.current = setTimeout(() => {
      if (voiceAiStatusRef.current === 'thinking') {
        console.warn("AI response watchdog triggered");
        setVoiceAiReply("I'm sorry, I'm taking too long to think. Please try again.");
        setVoiceAiStatus('idle');
        if (voiceAiOnRef.current) setTimeout(() => startVoiceAi(), 1000);
      }
    }, 15000);

    try {
      let fullText = "";
      const stream = aiEngine.generateResponseStream(text, voiceHistory, 'voice');
      
      let currentSentence = "";
      sentenceQueueRef.current = [];
      isSpeakingQueueRef.current = false;

      const playNextInQueue = async () => {
        if (!voiceAiOnRef.current) return;
        if (sentenceQueueRef.current.length === 0) {
          isSpeakingQueueRef.current = false;
          return;
        }
        isSpeakingQueueRef.current = true;
        const nextSentence = sentenceQueueRef.current.shift()!;
        await speakTextChunk(nextSentence);
        playNextInQueue();
      };

      const speakTextChunk = async (chunk: string) => {
        return new Promise<void>(async (resolve) => {
          if (!voiceAiOnRef.current) {
            resolve();
            return;
          }
          const cleanChunk = chunk
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#/g, '')
            .replace(/__/g, '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .trim();
          
          if (!cleanChunk) {
            resolve();
            return;
          }

          const isMalayalam = /[\u0D00-\u0D7F]/.test(cleanChunk);
          if (isMalayalam) {
            try {
              const base64Audio = await aiEngine.generateGemmaTTS(cleanChunk);
              if (base64Audio) {
                setVoiceAiStatus('Speaking (Gemma Voice Sync)...');
                const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
                gemmaAudioRef.current = audio;
                audio.onended = () => {
                  gemmaAudioRef.current = null;
                  resolve();
                };
                audio.onerror = () => {
                  gemmaAudioRef.current = null;
                  resolve();
                };
                audio.play();
                return;
              }
            } catch (e) { console.error(e); }
          }

          // Fallback to browser TTS (Optimized for speed)
          setVoiceAiStatus(`Answering (${isMalayalam ? 'Malayalam' : 'English'})...`);
          
          // Ensure speech synthesis is in a fresh state
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(cleanChunk);
          utterance.lang = isMalayalam ? 'ml-IN' : 'en-US';
          utterance.rate = 1.1; // Smooth professional cadence
          utterance.pitch = 1.0; // Natural tone
          utterance.volume = 1.0;
          
          // Get voices with a retry mechanism if none are available
          let voices = window.speechSynthesis.getVoices();
          if (voices.length === 0) {
            // Wait briefly for voices to load
            await new Promise(r => setTimeout(r, 100));
            voices = window.speechSynthesis.getVoices();
          }
          
          let selectedVoice = null;
          if (isMalayalam) {
            selectedVoice = voices.find(v => v.lang.startsWith('ml')) || voices.find(v => v.lang.startsWith('hi'));
          } else {
            selectedVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium')) && v.lang.startsWith('en')) 
                            || voices.find(v => v.lang.startsWith('en'));
          }
          if (selectedVoice) utterance.voice = selectedVoice;

          utterance.onstart = () => {
            setVoiceAiStatus(`Speaking...`);
          };

          utterance.onend = () => {
            resolve();
          };
          
          utterance.onerror = (e) => {
            console.error("Speech Error:", e);
            resolve();
          };

          // CRITICAL: Some browsers require a kickstart
          window.speechSynthesis.speak(utterance);
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        });
      };

      let sourceModel = aiEngine.getStatus().voiceModel;
      
      for await (const chunk of stream) {
        if (!voiceAiOnRef.current) break;
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        
        const { text, model, status } = chunk;
        if (model) sourceModel = model;
        
        if (status) {
          setVoiceAiStatus(status);
          // If we haven't received any text yet, update the reply area with the current reasoning status
          if (fullText === "") {
            setVoiceAiReply(status);
          }
          continue;
        }

        if (text) {
          // Once we get real text, replace the status/thinking message
          fullText += text;
          setVoiceAiReply(fullText);
          
          // Live update chat history for visibility
          setChatHistory(prev => {
            const h = [...prev];
            const last = h[h.length - 1];
            if (last && last.role === 'assistant') {
              h[h.length - 1] = { ...last, content: fullText, model: sourceModel };
              return h;
            } else {
              return [...h, { role: 'assistant', content: fullText, model: sourceModel }];
            }
          });
          
          const statusLabel = sourceModel.includes('Nano') ? 'Chrome Nano answering' : 
                             sourceModel.includes('Search') ? 'Gemma Researching' : 'Gemma 4 answering';
          setVoiceAiStatus(`${statusLabel}...`);

          currentSentence += text;
          
          // NATURAL CHUNKING: Split by major sentence marks for coherent human-like flow
          if (/[.!?\n]/.test(text)) {
            const parts = currentSentence.split(/([.!?\n])/);
            // Process chunks that have a delimiter
            for (let i = 0; i < parts.length - 1; i += 2) {
              const sentencePart = (parts[i] + (parts[i+1] || "")).trim();
              if (sentencePart.length > 2) {
                sentenceQueueRef.current.push(sentencePart);
                if (!isSpeakingQueueRef.current) {
                  playNextInQueue();
                }
              }
            }
            currentSentence = parts[parts.length - 1] || "";
          }

          // Force chunking for long mid-sentence segments to ensure responsiveness
          if (currentSentence.length > 140) {
            sentenceQueueRef.current.push(currentSentence.trim());
            currentSentence = "";
            if (!isSpeakingQueueRef.current) playNextInQueue();
          }
        }
      }

      // Final sentence if any
      if (currentSentence.trim() && voiceAiOnRef.current) {
        sentenceQueueRef.current.push(currentSentence.trim());
        if (!isSpeakingQueueRef.current) playNextInQueue();
      }

      const newHistory: AIMessage[] = [
        ...updatedHistory,
        { 
          role: 'assistant', 
          content: fullText, 
          model: sourceModel 
        }
      ];
      setVoiceHistory(newHistory.slice(-10));
      setChatHistory(newHistory);
      
      // Wait for all speech to finish before restarting listener
      if (speechFinishedIntervalRef.current) clearInterval(speechFinishedIntervalRef.current);
      speechFinishedIntervalRef.current = setInterval(() => {
        if (!isSpeakingQueueRef.current && !window.speechSynthesis.speaking && !gemmaAudioRef.current) {
          clearInterval(speechFinishedIntervalRef.current);
          speechFinishedIntervalRef.current = null;
          if (voiceAiOnRef.current) {
            setVoiceAiStatus('listening');
            setVoiceAiTranscript("Listening...");
            setTimeout(() => {
              if (voiceAiOnRef.current) startVoiceAi();
            }, 500);
          }
        }
      }, 500);

    } catch (err) {
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      setVoiceAiReply("Error: Failed to connect to AI engine. Please check your connection.");
      setVoiceAiStatus('idle');
      // Restart listening if still on
      if (voiceAiOnRef.current) {
        setTimeout(() => startVoiceAi(), 1000);
      }
    }
  };

  const speakResponse = async (response: AIResponse) => {
    const text = response.text;
    const model = response.model;
    
    setVoiceAiStatus(`Answering (${model})...`);
    
    if (text.startsWith("Error:")) {
      setVoiceAiStatus('idle');
      if (voiceAiOn) setTimeout(() => startVoiceAi(), 3000);
      return;
    }

    // Cancel any ongoing speech to prevent overlap or stuck state
    window.speechSynthesis.cancel();

    setVoiceAiStatus('speaking');
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/__/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // Detect if the text contains Malayalam characters
    const isMalayalam = /[\u0D00-\u0D7F]/.test(cleanText);

    // If Malayalam, try local Malayalam TTS first
    if (isMalayalam && malayalamStatus.ttsReady) {
      try {
        const audioBuffer = await MalayalamEngine.getInstance().speak(cleanText);
        if (audioBuffer) {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.onended = () => {
            setVoiceAiStatus('listening');
            setVoiceAiTranscript("Listening...");
            if (voiceAiOnRef.current) {
              setTimeout(() => {
                if (voiceAiOnRef.current) startVoiceAi();
              }, 500);
            }
          };
          source.start();
          return;
        }
      } catch (err) {
        console.error("Local Malayalam TTS Error:", err);
      }
    }

    // If Malayalam, try Gemma TTS first
    if (isMalayalam) {
      try {
        const base64Audio = await aiEngine.generateGemmaTTS(cleanText);
        if (base64Audio) {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
          gemmaAudioRef.current = audio;
          audio.onended = () => {
            console.log("Gemma TTS ended");
            gemmaAudioRef.current = null;
            setVoiceAiStatus('listening');
            setVoiceAiTranscript("Listening...");
            if (voiceAiOnRef.current) {
              setTimeout(() => {
                if (voiceAiOnRef.current) startVoiceAi();
              }, 500);
            }
          };
          audio.onerror = (e) => {
            console.error("Gemma TTS error:", e);
            gemmaAudioRef.current = null;
            // Fallback to browser TTS if Gemma fails
            fallbackToBrowserTTS(cleanText, true);
          };
          audio.play();
          return;
        }
      } catch (err) {
        console.error("Failed to use Gemma TTS:", err);
      }
    }

    // Fallback to browser TTS
    fallbackToBrowserTTS(cleanText, isMalayalam);
  };

  const fallbackToBrowserTTS = (cleanText: string, isMalayalam: boolean) => {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance; // Keep reference to prevent GC
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Attempt to select a high-quality English voice
    const voices = window.speechSynthesis.getVoices();
    
    let selectedVoice = null;
    if (isMalayalam) {
      selectedVoice = voices.find(v => v.lang.startsWith('ml')) || voices.find(v => v.lang.startsWith('hi'));
    } else {
      selectedVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')) && v.lang.startsWith('en')) 
                      || voices.find(v => v.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      console.log("Speech started");
    };

    utterance.onend = () => {
      console.log("Speech synthesis ended");
      setVoiceAiStatus('listening');
      setVoiceAiTranscript("Listening...");
      utteranceRef.current = null;
      // Restart listening after speaking
      if (voiceAiOnRef.current) {
        setTimeout(() => {
          if (voiceAiOnRef.current) {
            startVoiceAi();
          }
        }, 500);
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setVoiceAiStatus('listening');
      setVoiceAiTranscript("Listening...");
      utteranceRef.current = null;
      if (voiceAiOnRef.current) startVoiceAi();
    };

    // Small delay to ensure cancel() has finished
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };
  const [autoAnswerEnabled, setAutoAnswerEnabled] = useState(false);
  const [callInstructions, setCallInstructions] = useState<{ caller: string, instruction: string }[]>([
    { caller: 'Babu', instruction: 'meet me after 5\'o clock' },
    { caller: 'Clerk', instruction: 'Bring A4 paper' }
  ]);
  const [newCaller, setNewCaller] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [callViewTab, setCallViewTab] = useState<'log' | 'transcript'>('log');

  useEffect(() => {
    // Check connection type if supported
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const updateConnection = () => {
      if (!conn) {
        setConnectionType('wifi'); // Default to wifi if API not supported (common on desktop)
        return;
      }

      // 'type' is more specific (wifi, cellular, etc.) but not always available
      // 'effectiveType' is more about speed (4g, 3g, etc.)
      const type = conn.type;
      const effectiveType = conn.effectiveType;

      if (type) {
        if (type === 'wifi' || type === 'ethernet') {
          setConnectionType('wifi');
        } else if (type === 'cellular') {
          setConnectionType('mobile');
        } else {
          setConnectionType('unknown');
        }
      } else if (effectiveType) {
        // Fallback for browsers that only support effectiveType
        // On desktop, effectiveType '4g' is common for both Wifi and fast Mobile.
        // We'll assume wifi if it's not explicitly cellular (which 'type' would have caught)
        // or if we're on a desktop-like environment.
        if (effectiveType === '4g') setConnectionType('wifi');
        else setConnectionType('mobile');
      } else {
        setConnectionType('wifi');
      }
    };

    if (conn) {
      conn.addEventListener('change', updateConnection);
      updateConnection();
      return () => conn.removeEventListener('change', updateConnection);
    } else {
      updateConnection();
    }
  }, []);

  // handleDownloadGemma4 redirects to Brain2 tab to load Qwen3.5-0.8B (Light)
  const handleDownloadGemma4 = () => {
    setView('brain2');
  };

  const handleDownloadBrain1 = async () => {
    setIsBrain1Downloading(true);
    setBrain1Message("Initializing wllama engine for Nexus Qwen3.5-0.8B...");
    setBrain1Ready(false);

    const engine = HybridAIEngine.getInstance();
    await engine.loadBrain1((progress, text) => {
      setBrain1Progress(progress);
      setBrain1Message(progress < 100 ? `📥 ${text} (${progress}%)` : "🔍 Finalizing CPU/WASM initialization...");
    }, brain1Progress === 100);

    const status = engine.getStatus();
    setBrain1Ready(status.isBrain1Ready);
    setBrain1Message(
      status.isBrain1Ready
        ? "✅ Brain1 (Nexus Qwen3.5-0.8B) is live."
        : "⚠️ Brain1 failed to load."
    );
    setIsBrain1Downloading(false);
    setAiStatus(engine.getStatus());
  };

  const handleDownloadBrain2 = async () => {
    setIsBrain2Downloading(true);
    setBrain2Message("Initializing wllama engine for Nexus Gemma 3-1B...");
    setBrain2Ready(false);

    const engine = HybridAIEngine.getInstance();
    await engine.loadBrain2((progress, text) => {
      setBrain2Progress(progress);
      setBrain2Message(progress < 100 ? `📥 ${text} (${progress}%)` : "🔍 Finalizing CPU/WASM initialization...");
    }, brain2Progress === 100);

    const status = engine.getStatus();
    setBrain2Ready(status.isBrain2Ready);
    setBrain2Message(
      status.isBrain2Ready
        ? "✅ Brain2 (Nexus Gemma 3-1B) is live."
        : "⚠️ Brain2 failed to load."
    );
    setIsBrain2Downloading(false);
    setAiStatus(engine.getStatus());
  };

  const handleSetPreferredBrain = (id: 1 | 2) => {
    const engine = HybridAIEngine.getInstance();
    engine.setPreferredBrain(id);
    setPreferredBrain(id);
    setAiStatus(engine.getStatus());
  };

  const handleDownloadMalayalamTTS = async () => {
    const engine = MalayalamEngine.getInstance();
    await engine.loadTTS((progress) => {
      setMalayalamStatus(prev => ({ ...prev, ttsProgress: progress, isTTSLoading: progress < 100 }));
    });
    setMalayalamStatus(engine.getStatus());
  };

  const handleDownloadMalayalamSTT = async () => {
    const engine = MalayalamEngine.getInstance();
    await engine.loadSTT((progress) => {
      setMalayalamStatus(prev => ({ ...prev, sttProgress: progress, isSTTLoading: progress < 100 }));
    });
    setMalayalamStatus(engine.getStatus());
  };

  // Auto-download removed; user initiates from Brain2 tab

  useEffect(() => {
    const init = async () => {
      await localDB.init();
      const savedClients = localDB.query("SELECT * FROM clients");
      if (savedClients.length > 0) {
        setClients(savedClients);
      } else {
        const initial = [
          { id: 1, name: 'Elena Rodriguez', phone: '+1 555-0199', court: 'District Court, Aluva', case_number: 'OS 145/2025', next_date: '2026-03-15', purpose: 'Filing Written Statement' },
        ];
        initial.forEach(c => {
          localDB.run("INSERT INTO clients (name, phone, case_number, court, next_date, purpose) VALUES (?, ?, ?, ?, ?, ?)", 
            [c.name, c.phone, c.case_number, c.court, c.next_date, c.purpose]);
        });
        setClients(initial);
      }
      const status = aiEngine.getStatus();
      setAiStatus(status);
      setPreferredBrain(status.preferredBrain as 1 | 2);
      setMalayalamStatus(MalayalamEngine.getInstance().getStatus());
    };
    init();
  }, []);

  const sendConsult = async (initialText?: string) => {
    const text = initialText || consoleInput.trim();
    if (!text || consoleLoading) return;
    if (!initialText) setConsoleInput("");
    
    const userMsg: AIMessage = { role: 'user', content: text };
    setChatHistory(prev => [...prev, userMsg]);
    setConsoleLoading(true);
    
    // Determine task type: Search if it starts with "search" or "find"
    const isSearch = text.toLowerCase().startsWith('search') || text.toLowerCase().startsWith('find');
    const task = isSearch ? 'search' : 'general';

    try {
      console.log("Sending request to AI Engine:", text, task);
      const response = await aiEngine.generateResponse(text, chatHistory, undefined, task);
      console.log("AI Engine Response:", response);
      const assistantMsg: AIMessage = { role: 'assistant', content: response.text, model: response.model };
      const newHistory = [...chatHistory, userMsg, assistantMsg];
      setChatHistory(newHistory);
      setVoiceHistory(newHistory.slice(-10));
    } catch (err) { 
      console.error("Consultation Error:", err); 
    } finally { 
      setConsoleLoading(false); 
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadMessage = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_answer_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteMessage = (index: number) => {
    setChatHistory(prev => prev.filter((_, i) => i !== index));
  };

  const handleAIDrafting = async () => {
    if (!draftFacts.trim() || isDrafting) return;
    setIsDrafting(true);
    try {
      const prompt = `Based on the following facts of the case:
${draftFacts}

${draftModel ? `And using this model/template as a guide:
${draftModel}` : ''}

Please draft a formal legal document suitable for submission before a court. 
Maintain a professional legal tone, use appropriate legal terminology, and follow standard court formatting.`;

      const response = await aiEngine.generateResponse(prompt, [], undefined, 'drafting');
      setDraftPages([response.text]);

      // Get suggestions
      const suggestionPrompt = `Review the following legal draft and provide 3-5 specific suggestions for improvement or additional points to consider. Provide the suggestions as a bulleted list. Draft to review:
${response.text}`;
      const suggestions = await aiEngine.generateResponse(suggestionPrompt, [], undefined, 'drafting');
      setDraftSuggestions(suggestions.text);

    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleDownloadDraft = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    saveAs(blob, `Nexus_Draft_${new Date().getTime()}.txt`);
  };

  const sendDeskChat = async () => {
    if (!deskInput.trim() || deskLoading) return;
    const text = deskInput.trim();
    setDeskInput("");
    setDeskChatHistory(prev => [...prev, { role: 'user', text }]);
    setDeskLoading(true);
    try {
      const response = await aiEngine.generateResponse(text, [], undefined, 'drafting');
      setDeskChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) { console.error(err); } finally { setDeskLoading(false); }
  };

  const simulateIncomingCall = () => {
    setIncomingCall({
      id: Date.now(),
      clientName: "Elena Rodriguez",
      phone: "+1 555-0199",
      timestamp: new Date().toLocaleString(),
      duration: "0s",
      transcript: [],
      summary: "Incoming Call..."
    });
  };

  const handleAutoAnswer = async () => {
    if (!incomingCall) return;
    setIsAnswering(true);
    
    // Check for specific instructions
    const callerName = incomingCall?.clientName || '';
    const instruction = callInstructions.find(i => 
      callerName.toLowerCase().includes(i.caller.toLowerCase())
    );

    const isMalayalam = voiceLang === 'ml-IN';
    let greeting = "";
    
    if (isMalayalam) {
      greeting = instruction 
        ? `നമസ്കാരം, ഇത് നെക്സസ് ജസ്റ്റിസ് AI അസിസ്റ്റന്റ് ആണ്. നിങ്ങളുടെ കോളിനെക്കുറിച്ച്, ${instruction.instruction}.`
        : `നമസ്കാരം, ${callerName || 'നിങ്ങളുടെ'} കോളിനായി നെക്സസ് ജസ്റ്റിസ് AI അസിസ്റ്റന്റ് സംസാരിക്കുന്നു. ഞാൻ എങ്ങനെ സഹായിക്കണം?`;
    } else {
      greeting = instruction 
        ? `Hello, this is the Nexus Justice AI assistant. Regarding your call, ${instruction.instruction}.`
        : `Hello, this is the Nexus Justice AI assistant for ${callerName || 'your call'}. How can I assist you today?`;
    }
    
    // Use local Malayalam TTS if ready
    if (isMalayalam && malayalamStatus.ttsReady) {
      try {
        const audioBuffer = await MalayalamEngine.getInstance().speak(greeting);
        if (audioBuffer) {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.start();
        }
      } catch (err) {
        console.error("Auto-answer Malayalam TTS Error:", err);
      }
    } else {
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => isMalayalam ? v.lang.startsWith('ml') : (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural'))) 
                 || voices.find(v => isMalayalam ? v.lang.startsWith('ml') : v.lang.startsWith('en'));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => {
      setIncomingCall(null);
      setIsAnswering(false);
      // Automatically start Voice AI session after answering to continue the conversation
      startVoiceAi();
    }, 5000);
  };

  useEffect(() => {
    if (incomingCall && autoAnswerEnabled && !isAnswering) {
      const timer = setTimeout(() => {
        handleAutoAnswer();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [incomingCall, autoAnswerEnabled, isAnswering]);

  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanPhase('live');
    } catch (err) { setScanPhase('error'); }
  };

  const captureScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanPhase('processing');
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const imageBase64 = canvasRef.current.toDataURL('image/jpeg');
    try {
      const response = await aiEngine.generateResponse("Extract text from this legal document. Provide only the text found.", [], imageBase64);
      setScannedText(response.text);
      setScanPhase('done');
      // Auto-read the extracted text
      speakResponse(response);
    } catch (err) { setScanPhase('error'); } finally {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  };

  return (
    <div style={S.page} className="fixed inset-0 z-[100] selection:bg-indigo-500/30">
      {(!browserCompatibility.isCompatible && showCompatibilityBanner) && (
        <div className="fixed top-0 left-0 right-0 bg-indigo-600 border-b border-indigo-400/20 px-6 py-1 flex items-center justify-between z-[1000] shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="text-white font-black text-[8px] tracking-[0.2em] uppercase bg-white/20 px-2 py-0.5 rounded shadow-sm">
              {aiStatus.isLocalReady ? 'Local Active' : 'Hybrid Sync'}
            </span>
            <p className="text-[10px] text-white/90 font-bold tracking-tight">
              Active Engine: <span className="text-white underline decoration-white/30">{aiStatus.voiceModel}</span>. 
              {!aiStatus.isLocalReady && " (Update Chrome 146+ to unlock Local Device Reasoning)"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.open('https://www.google.com/chrome/', '_blank')}
              className="text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-all bg-white/10 px-3 py-1 rounded-full border border-white/20 hover:bg-white/20"
            >
              Update Chrome
            </button>
            <button 
              onClick={() => setShowCompatibilityBanner(false)}
              className="text-white/50 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {/* SIDEBAR */}
      <div style={S.sidebar} className="custom-scrollbar">
        <div className="w-full aspect-square bg-amber-500 flex items-center justify-center mb-4">
          <span className="text-2xl font-black text-black">T</span>
        </div>
        {sideNav.map(item => {
          const label = item.id === 'models' 
            ? (downloadProgress === 100 ? 'Brain Active' : (isDownloading ? 'Downloading...' : 'Download brain'))
            : item.label;
          return (
            <button key={item.id} onClick={() => setView(item.id)} title={label} style={S.sideBtn(view === item.id)}>
              <Icon path={item.icon} size={20} />
              {view === item.id && <div style={{ position: 'absolute', left: 0, width: 3, height: 24, background: '#f59e0b', borderRadius: '0 3px 3px 0' }} />}
            </button>
          );
        })}
        <div className="mt-auto pb-4">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={S.header}>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-black tracking-widest uppercase flex items-center gap-2">
              <span className="text-slate-200">NEXUS</span>
              <span className="text-indigo-500">JUSTICE</span>
              <span className="text-[10px] text-slate-500 font-bold ml-2">GEMMA 4 EDITION</span>
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isOffline ? (
              <div className="bg-red-500/10 text-red-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border border-red-500/20 animate-pulse">
                <WifiOff size={12} /> OFFLINE MODE
              </div>
            ) : (
              <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border border-emerald-500/20">
                <Shield size={12} /> LOCAL ACTIVE
              </div>
            )}
            <div className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border border-indigo-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> {aiStatus.isLocalReady ? 'GEMMA 4 LOCAL ACTIVE' : 'GEMMA 4 NATIVE ACTIVE'}
            </div>
          </div>
        </header>

        <div className="flex bg-[#070b14] border-b border-white/5 px-6 overflow-x-auto whitespace-nowrap custom-scrollbar">
          {topTabs.map(tab => {
            const label = tab.id === 'models'
              ? (downloadProgress === 100 ? 'BRAINS ACTIVE' : (isDownloading ? 'DOWNLOADING...' : 'BRAIN'))
              : tab.label;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`px-4 py-4 text-[10px] font-black tracking-widest transition-all relative inline-block ${view === tab.id ? 'text-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {label}
                {view === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>
            );
          })}
        </div>

        <main style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#020617' }}>
          <NeuralFlow />
          <AnimatePresence mode="wait">
            {view === 'command' && (
              <motion.div key="command" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, gap: 24, overflow: 'hidden' }}>
                <div className="flex-1 flex gap-6 overflow-hidden">
                  {/* Left Column */}
                  <div className="w-[400px] flex flex-col gap-6">
                    <div style={S.card} className="relative overflow-hidden">
                      <div className="text-[10px] font-black text-amber-500 tracking-[0.2em] mb-2">HYBRID AI NODE</div>
                      <h2 className="text-4xl font-black italic text-slate-200 mb-8">Command<span className="text-slate-500">Center</span></h2>
                      
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-6">
                          <div className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">VOICE NODE</div>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                        
                        <div className="flex gap-3 mb-8">
                          <button onClick={() => setVoiceAiOn(!voiceAiOn)} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${voiceAiOn ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)]'}`}>
                            {voiceAiOn ? 'Stop' : 'Start'}
                          </button>
                            <button 
                              onClick={() => handleDownloadGemma4()}
                              className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-sm text-slate-300 hover:bg-white/10 transition-all"
                            >
                              {isDownloading ? 'Downloading...' : downloadProgress === 100 ? 'Reload Neural Weights' : 'Download Neural weights'}
                            </button>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-300">Enable auto answering?</span>
                          <button onClick={() => setAutoAnswerEnabled(!autoAnswerEnabled)} className={`w-10 h-5 rounded-full relative transition-all ${autoAnswerEnabled ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${autoAnswerEnabled ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-[10px] text-slate-500 font-medium">Install app for best results</div>
                          <button onClick={simulateIncomingCall} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">Simulate Call</button>
                        </div>
                      </div>

                      {/* AI Auto-Responder Rules (Restored for convenience) */}
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-6">
                        <div className="text-[10px] font-black text-amber-400 tracking-widest uppercase mb-4">AUTO-RESPONDER RULES</div>
                        
                        <div className="space-y-3 mb-6 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                          {callInstructions.map((rule, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 group">
                              <div className="flex-1">
                                <div className="text-[10px] font-black text-indigo-400 uppercase">{rule.caller}</div>
                                <div className="text-xs text-slate-300 italic">"{rule.instruction}"</div>
                              </div>
                              <button 
                                onClick={() => setCallInstructions(callInstructions.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {callInstructions.length === 0 && (
                            <div className="text-[10px] text-slate-500 italic text-center py-4">No active rules</div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <input 
                            value={newCaller}
                            onChange={(e) => setNewCaller(e.target.value)}
                            placeholder="Caller name"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-all"
                          />
                          <input 
                            value={newInstruction}
                            onChange={(e) => setNewInstruction(e.target.value)}
                            placeholder="Instruction"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-all"
                          />
                          <button 
                            onClick={() => {
                              if (newCaller && newInstruction) {
                                setCallInstructions([...callInstructions, { caller: newCaller, instruction: newInstruction }]);
                                setNewCaller('');
                                setNewInstruction('');
                              }
                            }}
                            className="w-full py-2 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] text-indigo-400 hover:bg-white/10 transition-all uppercase tracking-widest"
                          >
                            Add Rule
                          </button>
                        </div>
                      </div>

                      {/* Gemma 4 E2B Model Management */}
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">Model Management</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">{connectionType === 'wifi' ? 'Wi-Fi' : connectionType === 'mobile' ? 'Mobile Data' : 'Unknown'}</span>
                            <div className={`w-2 h-2 rounded-full ${connectionType === 'wifi' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-200">Gemma 4 E2B</div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {downloadProgress === 100 ? 'Downloaded' : 'Not Downloaded'}
                            </div>
                          </div>

                          {(isDownloading || (downloadProgress > 0 && downloadProgress < 100)) && (
                            <div className="space-y-2">
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-indigo-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${downloadProgress}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-slate-400 italic">{downloadMessage}</div>
                            </div>
                          )}

                          {downloadMessage && !isDownloading && (downloadProgress === 0 || downloadProgress === 100) && (
                            <div className="text-[9px] text-slate-400 italic">{downloadMessage}</div>
                          )}

                          <div className="flex gap-2">
                            {downloadProgress < 100 && (
                              <button 
                                onClick={() => handleDownloadGemma4()}
                                disabled={isDownloading}
                                className="flex-1 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                              >
                                {isDownloading ? 'Downloading...' : 'Download Gemma 4 E2B'}
                              </button>
                            )}
                            <button 
                              onClick={() => speakResponse({ text: "Audio test successful. Nexus Justice is ready to assist you.", model: "System" })}
                              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] text-indigo-400 hover:bg-white/10 transition-all uppercase tracking-widest flex items-center gap-2"
                              title="Test Audio Output"
                            >
                              <Volume2 size={12} />
                              Test
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={S.card} className="flex-1 flex flex-col overflow-hidden p-0">
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                          <div className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">Conversation History</div>
                          <div className="text-[10px] font-black text-slate-500 uppercase">{voiceHistory.length} MESSAGES</div>
                        </div>
                          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {voiceHistory.map((msg, i) => (
                              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-2`}>
                                <div className={`max-w-[90%] p-5 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600/20 text-white border border-indigo-500/30' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${msg.role === 'user' ? 'bg-indigo-400' : 'bg-emerald-500'}`} />
                                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">{msg.role === 'user' ? 'USER QUERY' : (msg.model || 'NEXUS RESPONSE')}</span>
                                  </div>
                                  <div className="markdown-body text-sm leading-relaxed">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                      </div>

                      <div className="flex items-end gap-1.5 h-12 mb-6">
                        {[0.4, 0.7, 0.3, 0.9, 0.5, 0.8, 0.4, 0.6, 0.3, 0.7, 0.5, 0.9, 0.4, 0.6, 0.3, 0.8, 0.5, 0.7].map((h, i) => (
                          <div key={i} className="flex-1 bg-amber-500/80 rounded-full" style={{ height: `${h * 100}%` }} />
                        ))}
                      </div>

                      <div className="text-[10px] font-black text-slate-600 tracking-widest">SYSTEM: NEURAL CORE</div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    <div style={S.card} className="flex-1 flex flex-col overflow-hidden p-0">
                      <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                        <div className="text-[10px] font-black text-amber-500 tracking-widest uppercase">CALL LOGS & TRANSCRIPTS</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase">{SIMULATED_CALLS.length} CALLS RECORDED</div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {SIMULATED_CALLS.map(call => (
                          <div 
                            key={call.id} 
                            onClick={() => setSelectedCall(selectedCall?.id === call.id ? null : call)} 
                            className={`p-5 bg-white/5 border transition-all group rounded-3xl cursor-pointer ${
                              selectedCall?.id === call.id ? 'border-amber-500/50 bg-white/10' : 'border-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                selectedCall?.id === call.id ? 'bg-amber-500 text-black' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                              }`}>
                                <Users size={20} />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="font-black text-slate-200">{call.clientName}</div>
                                  <div className="text-[10px] font-black text-slate-500">{call.timestamp}</div>
                                </div>
                                <div className="text-xs text-slate-500 mb-3">{call.phone}</div>
                                <div className="text-xs text-slate-400 italic leading-relaxed">{call.summary}</div>
                              </div>
                              <div className="text-[10px] font-black text-slate-600 self-end">Duration: {call.duration}</div>
                            </div>

                            <AnimatePresence>
                              {selectedCall?.id === call.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                                    <div className="text-[9px] font-black text-indigo-400 tracking-widest uppercase mb-2">TRANSCRIPT</div>
                                    <div className="bg-black/20 p-4 rounded-2xl space-y-4 border border-white/5">
                                      {call.transcript?.map((t: any, i: number) => (
                                        <div key={i} className="space-y-1">
                                          <div className={`text-[9px] font-black uppercase tracking-widest ${t.role === 'client' ? 'text-amber-500' : 'text-indigo-400'}`}>{t.role}</div>
                                          <div className="text-sm text-slate-300 leading-relaxed">{t.text}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'consult' && (
              <motion.div key="consult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#070b14]">
                  <div>
                    <h2 className="text-3xl font-black italic text-slate-200">AI <span className="text-indigo-500">Consult</span></h2>
                    <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-1">Legal Intelligence & Case Analysis</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase">
                        {aiEngine.getStatus().voiceModel} Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                        <MessageSquare size={40} className="text-indigo-500" />
                      </div>
                      <h3 className="text-xl font-black italic text-slate-300 mb-2">No Active Consultation</h3>
                      <p className="text-sm text-slate-500 max-w-xs">Ask a question or use voice commands to start a legal analysis session.</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] p-6 rounded-3xl border ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' 
                            : 'bg-white/5 border-white/10 text-slate-200 rounded-tl-none'
                        }`}>
                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-5 h-5 bg-indigo-500 rounded-lg flex items-center justify-center">
                                <Cpu size={12} className="text-white" />
                              </div>
                              <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase">
                                {msg.model || 'NEXUS AI'}
                              </span>
                            </div>
                          )}
                          <div className="markdown-body">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          
                          {msg.role === 'assistant' && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                              <div className="w-4 h-4 bg-indigo-500/20 rounded flex items-center justify-center">
                                <Cpu size={10} className="text-indigo-400" />
                              </div>
                              <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase">
                                Response Source: <span className={msg.model?.includes('Local') ? 'text-emerald-400' : 'text-indigo-400'}>{msg.model || 'Gemma 4 E2B'}</span>
                              </span>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {msg.role === 'assistant' && (
                                <>
                                  <button 
                                    onClick={() => handleCopy(msg.content)}
                                    className="text-slate-500 hover:text-indigo-400 transition-all p-1.5 hover:bg-white/5 rounded-lg"
                                    title="Copy Answer"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDownloadMessage(msg.content)}
                                    className="text-slate-500 hover:text-indigo-400 transition-all p-1.5 hover:bg-white/5 rounded-lg"
                                    title="Download Answer"
                                  >
                                    <Download size={13} />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => handleDeleteMessage(i)}
                                className={`${msg.role === 'user' ? 'text-white/40 hover:text-white' : 'text-slate-500 hover:text-red-400'} transition-all p-1.5 hover:bg-white/5 rounded-lg`}
                                title="Delete Message"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="p-6 bg-[#070b14] border-t border-white/5">
                  <div className="max-w-4xl mx-auto relative">
                    <input 
                      value={consoleInput}
                      onChange={(e) => setConsoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendConsult()}
                      placeholder="Ask the AI anything..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-slate-200 outline-none focus:border-indigo-500/50 transition-all pr-16"
                    />
                    <button 
                      onClick={() => sendConsult()}
                      disabled={consoleLoading}
                      className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50"
                    >
                      {consoleLoading ? <RotateCcw size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'feed' && (
              <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6 overflow-y-auto space-y-6">
                <h2 className="text-3xl font-black italic text-slate-200">Activity <span className="text-slate-500">Feed</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div style={S.card}>
                    <div className="text-[10px] font-black text-amber-500 tracking-widest mb-4">UPCOMING HEARINGS</div>
                    <div className="space-y-4">
                      {clients.map(c => (
                        <div key={c.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-black">{c.name[0]}</div>
                          <div className="flex-1">
                            <div className="text-sm font-bold">{c.name}</div>
                            <div className="text-[10px] text-slate-500">{c.court}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black text-emerald-500">{c.next_date}</div>
                            <div className="text-[9px] text-slate-600">{c.purpose}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={S.card}>
                    <div className="text-[10px] font-black text-indigo-500 tracking-widest mb-4">PLATFORM UPDATES</div>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-sm font-bold mb-1">Nexus v3.1 Released</div>
                        <div className="text-xs text-slate-500">New hybrid AI engine with offline support is now active.</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-sm font-bold mb-1">Bar Council Integration</div>
                        <div className="text-xs text-slate-500">Direct filing integration for High Court is coming soon.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'clients' && (
              <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6 overflow-y-auto space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black italic text-slate-200">Client <span className="text-slate-500">Registry</span></h2>
                  <button className="bg-indigo-600 px-6 py-2.5 rounded-2xl font-black text-xs tracking-widest uppercase">Add Client</button>
                </div>
                <div style={S.card} className="overflow-hidden p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Case Number</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Court</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Next Date</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold">{c.name}</div>
                            <div className="text-[10px] text-slate-500">{c.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded text-[10px] font-black">{c.case_number}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">{c.court}</td>
                          <td className="px-6 py-4 text-xs text-emerald-500 font-bold">{c.next_date}</td>
                          <td className="px-6 py-4">
                            <button className="text-slate-500 hover:text-white transition-colors"><Edit3 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {view === 'knowledge' && (
              <motion.div key="knowledge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6 overflow-y-auto space-y-6">
                <h2 className="text-3xl font-black italic text-slate-200">Legal <span className="text-slate-500">Knowledge Base</span></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'The Railways Act, 1989', category: 'Railway Law', year: '1989' },
                    { title: 'Transfer of Property Act, 1882', category: 'Property Law', year: '1882' },
                    { title: 'Indian Penal Code', category: 'Criminal Law', year: '1860' },
                    { title: 'Cooperative Societies Act', category: 'Cooperative Law', year: '1912' },
                    { title: 'Industrial Disputes Act', category: 'Labour Law', year: '1947' },
                  ].map((doc, i) => (
                    <div key={i} style={S.card} className="group hover:border-indigo-500/30 transition-all cursor-pointer">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                        <BookOpen size={24} />
                      </div>
                      <div className="text-[9px] font-black text-indigo-500 tracking-widest uppercase mb-1">{doc.category}</div>
                      <div className="text-sm font-bold mb-2">{doc.title}</div>
                      <div className="text-[10px] text-slate-500">Enacted: {doc.year}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'drafting' && (
              <motion.div key="drafting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex overflow-hidden">
                {/* Left Panel: Inputs */}
                <div className="w-80 flex flex-col border-r border-white/5 bg-[#070b14]">
                  <div className="p-6 border-b border-white/5">
                    <div className="text-[10px] font-black text-indigo-500 tracking-widest uppercase">CASE INPUTS</div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Fact of the Case</label>
                        <button onClick={() => setEnlargedElement('facts')} className="p-1 text-slate-500 hover:text-indigo-400 transition-colors" title="Enlarge">
                          <Maximize2 size={12} />
                        </button>
                      </div>
                      <textarea 
                        value={draftFacts} 
                        onChange={e => setDraftFacts(e.target.value)}
                        placeholder="Enter the facts of the case here..."
                        className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-300 focus:border-indigo-500 transition-colors resize-none custom-scrollbar"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Model Draft / Template</label>
                        <button onClick={() => setEnlargedElement('model')} className="p-1 text-slate-500 hover:text-indigo-400 transition-colors" title="Enlarge">
                          <Maximize2 size={12} />
                        </button>
                      </div>
                      <textarea 
                        value={draftModel} 
                        onChange={e => setDraftModel(e.target.value)}
                        placeholder="Upload or paste a model draft..."
                        className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-300 focus:border-indigo-500 transition-colors resize-none custom-scrollbar"
                      />
                    </div>
                    <button 
                      onClick={handleAIDrafting}
                      disabled={isDrafting || !draftFacts.trim()}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl font-black text-[10px] text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      {isDrafting ? <RotateCcw size={14} className="animate-spin" /> : <Zap size={14} />}
                      {isDrafting ? "GENERATING..." : "GENERATE DRAFT"}
                    </button>
                  </div>
                </div>

                {/* Middle Panel: Writing Pad */}
                <div className="flex-1 flex flex-col border-r border-white/5">
                  <div className="h-12 bg-white/5 border-b border-white/5 flex items-center justify-between px-6">
                    <div className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">TEMPORARY WRITING PAD</div>
                    <div className="flex gap-2">
                      <button onClick={() => setEnlargedElement('pad')} className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors" title="Enlarge"><Maximize2 size={16} /></button>
                      <button onClick={() => handleCopy(draftPages[0])} className="p-1.5 text-slate-500 hover:text-white transition-colors" title="Copy"><Copy size={16} /></button>
                      <button onClick={() => handleDownloadDraft(draftPages[0])} className="p-1.5 text-slate-500 hover:text-white transition-colors" title="Download"><Download size={16} /></button>
                    </div>
                  </div>
                  <div className="flex-1 p-10 bg-black/20 overflow-y-auto custom-scrollbar">
                    <div className="max-w-2xl mx-auto bg-white/5 p-12 rounded-lg shadow-2xl min-h-full font-serif text-slate-300 leading-relaxed whitespace-pre-wrap outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => setDraftPages([e.currentTarget.innerText])}>
                      {draftPages[0]}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Suggestions & Chat */}
                <div className="w-80 flex flex-col bg-[#070b14]">
                  <div className="p-6 border-b border-white/5">
                    <div className="text-[10px] font-black text-emerald-500 tracking-widest uppercase">AI SUGGESTIONS</div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {draftSuggestions && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Info size={12} /> Improvement Points
                        </div>
                        <div className="text-[11px] text-slate-300 leading-relaxed markdown-body">
                          <ReactMarkdown>{draftSuggestions}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase">CHAT ASSISTANT</div>
                      {deskChatHistory.map((msg, i) => (
                        <div key={i} className={`p-4 rounded-2xl text-xs leading-relaxed markdown-body ${msg.role === 'ai' ? 'bg-white/5 border border-white/10' : 'bg-indigo-600/20 border border-indigo-600/30'}`}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 border-t border-white/5">
                    <div className="flex gap-2">
                      <input value={deskInput} onChange={e => setDeskInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendDeskChat()} placeholder="Refine draft..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs" />
                      <button onClick={sendDeskChat} className="bg-indigo-600 p-2 rounded-xl"><Send size={14} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'notif' && (
              <motion.div key="notif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6 overflow-y-auto space-y-6">
                <h2 className="text-3xl font-black italic text-slate-200">Notifications</h2>
                <div className="space-y-4">
                  {[
                    { title: 'System Update', message: 'Nexus Justice v3.1 is now live with hybrid AI capabilities.', time: '2 hours ago', type: 'info' },
                    { title: 'New Case Assigned', message: 'You have a new case request from Elena Rodriguez.', time: '5 hours ago', type: 'case' },
                    { title: 'Subscription Renewal', message: 'Your Elite plan expires in 15 days.', time: '1 day ago', type: 'warning' },
                  ].map((n, i) => (
                    <div key={i} style={S.card} className="flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {n.type === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm font-bold">{n.title}</div>
                          <div className="text-[10px] text-slate-500">{n.time}</div>
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed">{n.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'support' && (
              <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6 flex flex-col gap-4">
                <h2 className="text-3xl font-black italic text-slate-200">Help & <span className="text-slate-500">Support</span></h2>
                <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-3xl p-6 overflow-y-auto space-y-4">
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed bg-white/5 border border-white/10">
                      Hello! I am the Nexus Support Assistant. How can I help you today?
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input placeholder="Describe your issue..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm" />
                  <button className="bg-indigo-600 px-6 rounded-2xl font-bold">Send</button>
                </div>
              </motion.div>
            )}

            {view === 'read' && (
              <motion.div key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6 flex gap-6">
                <div className="w-1/2 flex flex-col gap-4">
                  <div className="flex-1 bg-black rounded-3xl overflow-hidden relative border border-white/10">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    {scanPhase === 'processing' && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <div className="text-xs font-black tracking-widest uppercase text-indigo-400">Analyzing Document</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={scanPhase === 'live' ? captureScan : startScan} className="flex-1 py-4 bg-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2">
                      {scanPhase === 'live' ? <Camera size={20} /> : <Play size={20} />}
                      {scanPhase === 'live' ? 'Capture & Read' : 'Start Camera'}
                    </button>
                    {scannedText && (
                      <button onClick={() => speakResponse({ text: scannedText, model: "OCR" })} className="p-4 bg-indigo-600 rounded-2xl">
                        <Volume2 size={24} />
                      </button>
                    )}
                    {scannedText && (
                      <button 
                        onClick={() => {
                          setDraftFacts(prev => prev + (prev.trim() ? "\n\n" : "") + scannedText);
                          setView('drafting');
                          setEnlargedElement('facts');
                        }} 
                        className="p-4 bg-emerald-600 rounded-2xl"
                        title="Send to Drafting Facts"
                      >
                        <Plus size={24} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-3xl p-6 overflow-y-auto relative">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Extracted Text</div>
                    {scannedText && <button onClick={() => setScannedText("")} className="text-slate-500 hover:text-white text-[10px] uppercase font-black tracking-widest">Clear</button>}
                  </div>
                  <div className="text-sm text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">{scannedText || "Waiting for capture..."}</div>
                </div>
              </motion.div>
            )}

            {view === 'convert' && (
              <motion.div key="convert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6 flex gap-6 overflow-hidden">
                {/* Left Sidebar: Tools & Image Preview */}
                <div className="w-[280px] flex flex-col gap-4 flex-shrink-0 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4">Nexus Tools</div>
                    <h3 className="text-2xl font-black italic mb-6">Doc<span className="text-slate-500">Converter</span></h3>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          if (scanPhase !== 'live') startScan();
                          else captureForConverter();
                        }} 
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 text-indigo-400 hover:bg-white/10 transition-all"
                      >
                        <Camera size={20} /> {scanPhase === 'live' ? 'Capture Document' : 'Use Camera'}
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 text-emerald-400 hover:bg-white/10 transition-all"
                      >
                        <Upload size={20} /> Upload from Device
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    </div>
                  </div>

                  {converterImage && (
                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-4 flex flex-col gap-4">
                      <div className="aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-white/10">
                        <img src={converterImage} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                      <button 
                        onClick={processConversion} 
                        disabled={converterStatus === 'processing'} 
                        className="w-full py-4 bg-indigo-600 rounded-2xl font-bold disabled:opacity-50"
                      >
                        {converterStatus === 'processing' ? 'AI Processing...' : 'Extract & Convert'}
                      </button>
                    </div>
                  )}

                  {converterStatus === 'done' && (
                    <div className="flex flex-col gap-3">
                      <button onClick={exportToPDF} className="w-full py-4 bg-red-600/20 border border-red-600/30 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-red-600/30 transition-all">
                        <FileText size={20} /> Export as PDF
                      </button>
                      <button onClick={exportToWord} className="w-full py-4 bg-blue-600/20 border border-blue-600/30 text-blue-500 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-600/30 transition-all">
                        <File size={20} /> Export as Word
                      </button>
                      <button 
                        onClick={() => {
                          setDraftFacts(prev => prev + (prev.trim() ? "\n\n" : "") + scannedText);
                          setView('drafting');
                          setEnlargedElement('facts');
                        }} 
                        className="w-full py-4 bg-emerald-600/20 border border-emerald-600/30 text-emerald-500 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-600/30 transition-all"
                      >
                        <Plus size={20} /> Send to Drafting Facts
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Area: Document Text Preview */}
                <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-3xl p-8 flex flex-col overflow-hidden relative">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Document Preview</div>
                    <div className="flex items-center gap-4">
                      {converterStatus === 'done' && (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <CheckCircle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Ready for Export</span>
                        </div>
                      )}
                      <button 
                        onClick={() => setIsPreviewEnlarged(true)}
                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Enlarge Preview"
                      >
                        <Maximize2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 bg-black/40 rounded-3xl p-8 overflow-y-auto font-mono text-sm text-slate-400 leading-relaxed whitespace-pre-wrap border border-white/5">
                    {converterText || (converterStatus === 'processing' ? "Nexus AI is analyzing the document structure and content..." : "Capture or upload a document to begin the conversion process.")}
                  </div>
                </div>

                {/* Enlarge Modal Overlay */}
                <AnimatePresence>
                  {isPreviewEnlarged && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl p-12 flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Nexus AI Document Preview</div>
                          <h2 className="text-3xl font-black italic">Full View<span className="text-slate-500">Mode</span></h2>
                        </div>
                        <button 
                          onClick={() => setIsPreviewEnlarged(false)}
                          className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Minimize2 size={24} />
                        </button>
                      </div>
                      <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-[40px] p-12 overflow-y-auto font-mono text-lg text-slate-300 leading-loose whitespace-pre-wrap">
                        {converterText}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Right Sidebar: AI Translation & Arrangements */}
                <div className="w-[340px] flex flex-col gap-6 flex-shrink-0 overflow-y-auto pr-2 custom-scrollbar">
                  {converterStatus === 'done' && (
                    <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">AI Translation</div>
                        {isTranslating && <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 animate-pulse">Translating...</div>}
                      </div>
                      <div className="flex flex-col gap-3">
                        <input 
                          value={targetLanguage}
                          onChange={(e) => setTargetLanguage(e.target.value)}
                          placeholder="Target language..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 transition-all"
                        />
                        <button 
                          onClick={handleTranslate}
                          disabled={isTranslating || !targetLanguage}
                          className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                        >
                          {isTranslating ? <RotateCcw size={14} className="animate-spin" /> : <Globe size={14} />}
                          Translate Document
                        </button>
                      </div>
                      {translatedText && (
                        <div className="mt-2 p-4 bg-black/40 rounded-xl border border-white/5 max-h-[300px] overflow-y-auto text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                          {translatedText}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6">System Arrangements</div>
                    <div className="flex flex-col gap-3">
                      {CONVERTER_STEPS.map(step => (
                        <button 
                          key={step.id} 
                          onClick={() => {
                            if (step.id === 1) {
                              if (scanPhase !== 'live') startScan();
                              else captureForConverter();
                            } else if (step.id === 2) {
                              fileInputRef.current?.click();
                            } else if (step.id === 3) {
                              if (converterImage) processConversion();
                            } else if (step.id === 4) {
                              if (converterStatus === 'done') handleTranslate();
                            } else if (step.id === 5) {
                              if (converterStatus === 'done') exportToPDF();
                            } else if (step.id === 6) {
                              if (converterStatus === 'done') exportToWord();
                            }
                          }}
                          disabled={
                            (step.id === 3 && (!converterImage || converterStatus === 'processing')) ||
                            (step.id >= 4 && converterStatus !== 'done') ||
                            (step.id === 4 && isTranslating)
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 group hover:border-white/10 transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${step.color}15`, color: step.color }}>
                            {step.icon}
                          </div>
                          <div>
                            <div className="text-[11px] font-black text-slate-200 mb-0.5">{step.title}</div>
                            <div className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">{step.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {view === 'instructions' && (
              <motion.div key="instructions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-100 p-8 flex flex-col gap-8 overflow-hidden">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-black text-amber-500 tracking-[0.2em] mb-2 uppercase">System Configuration</div>
                    <h2 className="text-5xl font-black italic text-slate-200">Auto-Responder<span className="text-slate-500">Rules</span></h2>
                  </div>
                  <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enable auto answering?</span>
                      <button onClick={() => setAutoAnswerEnabled(!autoAnswerEnabled)} className={`w-10 h-5 rounded-full relative transition-all ${autoAnswerEnabled ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${autoAnswerEnabled ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Rules</div>
                        <div className="text-2xl font-black text-indigo-500">{callInstructions.length}</div>
                      </div>
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                        <Shield size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex gap-8 overflow-hidden">
                  {/* Rules List */}
                  <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-[40px] p-8 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                      <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Instruction Registry</div>
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                        <Info size={12} />
                        AI will use these rules to answer calls automatically
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                      {callInstructions.map((rule, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={idx} 
                          className="p-6 bg-white/5 border border-white/5 rounded-3xl flex justify-between items-center group hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl">
                              {rule.caller.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">{rule.caller}</div>
                              <div className="text-xl font-medium text-slate-200 italic">"{rule.instruction}"</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setCallInstructions(callInstructions.filter((_, i) => i !== idx))}
                            className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={20} />
                          </button>
                        </motion.div>
                      ))}
                      {callInstructions.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 py-20">
                          <Shield size={48} className="mb-4 opacity-20" />
                          <div className="text-sm font-bold uppercase tracking-widest">No Active Rules</div>
                          <div className="text-[10px] mt-2">Add a rule to enable automated responses</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Rule Sidebar */}
                  <div className="w-[400px] flex flex-col gap-6">
                    <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8">
                      <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-8">Deploy New Rule</div>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Caller Identity</label>
                          <input 
                            value={newCaller}
                            onChange={(e) => setNewCaller(e.target.value)}
                            placeholder="e.g. Babu, Clerk, Client Name..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-slate-200 outline-none focus:border-indigo-500/50 transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">AI Instruction</label>
                          <textarea 
                            value={newInstruction}
                            onChange={(e) => setNewInstruction(e.target.value)}
                            placeholder="What should the AI say?..."
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-slate-200 outline-none focus:border-indigo-500/50 transition-all font-medium resize-none"
                          />
                        </div>

                        <button 
                          onClick={() => {
                            if (newCaller && newInstruction) {
                              setCallInstructions([...callInstructions, { caller: newCaller, instruction: newInstruction }]);
                              setNewCaller('');
                              setNewInstruction('');
                            }
                          }}
                          disabled={!newCaller || !newInstruction}
                          className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 rounded-2xl font-black text-sm text-white transition-all uppercase tracking-[0.2em] shadow-[0_8px_30px_rgba(79,70,229,0.3)]"
                        >
                          Register Rule
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-8">
                      <div className="flex items-center gap-3 text-amber-500 mb-4">
                        <AlertTriangle size={20} />
                        <div className="text-[10px] font-black uppercase tracking-widest">System Note</div>
                      </div>
                      <p className="text-xs text-amber-500/70 leading-relaxed font-medium">
                        Auto-responder rules are matched against incoming caller names. Ensure the names match your client registry for maximum accuracy.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {view === 'models' && (
              <motion.div key="models" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-8 flex flex-col gap-8 overflow-hidden">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-black text-indigo-500 tracking-[0.2em] mb-2 uppercase">Nexus Justice: Model Manager</div>
                    <h2 className="text-5xl font-black italic text-slate-200">Gemma 4 <span className="text-slate-500 text-base ml-1">Chrome Optimized</span></h2>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Connection Status</div>
                      <div className={`text-sm font-black uppercase transition-all ${isOffline ? 'text-red-500' : 'text-emerald-500'}`}>
                        {isOffline ? 'Disconnected' : 'Chrome Backend: Connected'}
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOffline ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {isOffline ? <WifiOff size={20} /> : <Zap size={20} />}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex gap-8 overflow-hidden">
                  <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-[40px] p-10 flex flex-col overflow-hidden">
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-8">Active Chrome Models</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: "Gemma 4 E2B", type: "Reasoning & Action", status: aiStatus.isLocalReady ? "Local" : (aiStatus.builtIn ? "Native" : "Inactive"), icon: <Cpu />, desc: "Primary engine for real-time legal reasoning and lightning-fast voice context." },
                        { name: "Gemma 4 E4B", type: "Complex Analysis", status: aiStatus.builtIn ? "Active" : "Inactive", icon: <Cpu />, desc: "Large-scale model for detailed legal drafting and judicial case comparisons." },
                        { name: "Chrome Search Tool", type: "Live Web Access", status: aiStatus.builtIn ? "Connected" : "Disconnected", icon: <Globe />, desc: "Gemma 4-powered web search for Supreme Court judgments and live legal data." },
                        { name: "Gemma Voice Engine", type: "Audio Orchestrator", status: malayalamStatus.ttsReady ? "Ready" : "Standby", icon: <Volume2 />, desc: "Unified engine for high-fidelity legal voice processing and translation." }
                      ].map((m, i) => (
                        <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all cursor-default">
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                              {m.icon}
                            </div>
                            <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                              {m.status}
                            </div>
                          </div>
                          <div className="text-sm font-black text-slate-200 mb-1">{m.name}</div>
                          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">{m.type}</div>
                          <div className="text-xs text-slate-500 leading-relaxed italic">{m.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-80 flex flex-col gap-6">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[40px] p-8">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Neural Status</div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Gemma 4 E2B</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${aiStatus.isLocalReady ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {aiStatus.isLocalReady ? 'Ready' : (downloadProgress > 0 && downloadProgress < 100 ? 'Loading...' : 'Standby')}
                          </span>
                        </div>
                        {isDownloading && (
                          <div className="space-y-2">
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                               <motion.div className="h-full bg-indigo-500" animate={{ width: `${downloadProgress}%` }} />
                             </div>
                             <div className="text-[9px] text-indigo-400 italic font-medium">{downloadMessage}</div>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => handleDownloadGemma4()}
                          disabled={isDownloading}
                          className="w-full py-4 bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {downloadProgress === 100 ? 'Download Neural weights Again' : 'Download Neural weights'}
                        </button>

                        {downloadProgress === 100 && !isDownloading && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[9px] font-bold text-center uppercase tracking-widest">
                            Neural weights successfully deployed
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-[40px] p-8">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">System Health</div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Latency</span>
                          <span className="text-xs font-black text-emerald-500">240ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Memory Load</span>
                          <span className="text-xs font-black text-indigo-400">4.2GB / 8GB</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Tool Sync</span>
                          <span className="text-xs font-black text-emerald-500">Synced</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'brain2' && (
              <motion.div key="brain2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-6 flex flex-col gap-6 overflow-y-auto">
                {/* Header */}
                <div>
                  <div className="text-[10px] font-black text-amber-500 tracking-[0.2em] mb-1 uppercase">On-Device · CPU/WASM · GGUF Format · Works on Any Phone</div>
                  <h2 className="text-4xl font-black italic text-slate-200">Nexus <span className="text-amber-500">Brains</span></h2>
                  <p className="text-xs text-slate-500 mt-1">No WebGPU required. Downloads once, runs fully offline. Download Brain1, Brain2, or both.</p>
                </div>

                {/* Inference chain */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Active Inference Chain</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
                      <span className={`px-3 py-1 rounded-full border transition-all ${brain1Ready ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-500 border-white/10'} ${preferredBrain === 1 ? 'ring-1 ring-emerald-500/50' : ''}`}>
                        {preferredBrain === 1 ? '1.' : '2.'} Brain1 — Qwen3.5-0.8B {brain1Ready ? '✓' : '(not loaded)'}
                        {preferredBrain === 1 && <span className="ml-1 text-[8px] opacity-70">(Primary)</span>}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className={`px-3 py-1 rounded-full border transition-all ${brain2Ready ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-slate-500 border-white/10'} ${preferredBrain === 2 ? 'ring-1 ring-amber-500/50' : ''}`}>
                        {preferredBrain === 2 ? '1.' : '2.'} Brain2 — Gemma 3-1B {brain2Ready ? '✓' : '(not loaded)'}
                        {preferredBrain === 2 && <span className="ml-1 text-[8px] opacity-70">(Primary)</span>}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className="bg-slate-800 text-slate-500 px-3 py-1 rounded-full border border-white/5">3. Offline Fallback</span>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (confirm('Delete all local neural weights from browser cache?')) {
                        try {
                          // Clear wllama IndexedDB
                          const dbs = await window.indexedDB.databases();
                          dbs.forEach(db => {
                            if (db.name?.includes('wllama')) window.indexedDB.deleteDatabase(db.name);
                          });
                          window.location.reload();
                        } catch (e) {
                          alert('Cache purge initiated. Please refresh page.');
                        }
                      }
                    }}
                    className="text-[9px] font-black uppercase text-slate-500 hover:text-red-500 transition-colors border border-white/5 px-4 py-2 rounded-xl"
                  >
                    Purge Local Cache
                  </button>
                </div>

                {/* Two-column download cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Brain1 Card */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Brain1 · Primary</div>
                        <div className="text-lg font-black text-slate-200">Qwen3.5-0.8B</div>
                        <div className="text-[10px] text-slate-400">Q4_K_M · ~533 MB · Best quality</div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${brain1Ready ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                        <Cpu size={18} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Format', value: 'GGUF / WASM' },
                        { label: 'Quant', value: 'Q4_K_M' },
                        { label: 'Size', value: '~533 MB' },
                        { label: 'RAM needed', value: '~1.5 GB' },
                        { label: 'Context', value: '2048 tokens' },
                        { label: 'WebGPU', value: 'Not needed' },
                      ].map((item, i) => (
                        <div key={i} className="p-2 bg-white/5 rounded-xl">
                          <div className="text-[8px] font-black text-slate-500 uppercase">{item.label}</div>
                          <div className="text-[10px] font-bold text-slate-300">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[9px] text-slate-400">Download progress</span>
                        <span className={`text-[9px] font-black uppercase ${brain1Ready ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {brain1Ready ? 'LOADED' : brain1Progress > 0 && brain1Progress < 100 ? `${brain1Progress}%` : 'NOT LOADED'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-emerald-500" animate={{ width: `${brain1Progress}%` }} transition={{ ease: 'easeOut' }} />
                      </div>
                      <div className="text-[8px] text-slate-500 italic">{brain1Message}</div>
                    </div>

                    <button
                      onClick={handleDownloadBrain1}
                      disabled={isBrain1Downloading}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isBrain1Downloading
                        ? <><RotateCcw size={14} className="animate-spin" /> Downloading...</>
                        : brain1Ready
                          ? <><RotateCcw size={14} /> Reload Brain1</>
                          : <><Download size={14} /> Download Brain1</>
                      }
                    </button>

                    {brain1Ready && (
                      <div className="flex flex-col gap-2">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[9px] font-bold text-center uppercase tracking-widest flex items-center justify-center gap-2">
                          <CheckCircle size={12} /> Brain1 Active · CPU/WASM
                        </div>
                        <button
                          onClick={() => handleSetPreferredBrain(1)}
                          disabled={preferredBrain === 1}
                          className={`w-full py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                            preferredBrain === 1 
                              ? 'bg-emerald-500 text-black cursor-default' 
                              : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/5'
                          }`}
                        >
                          {preferredBrain === 1 ? 'Current Primary' : 'Set as Primary'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Brain2 Card */}
                  <div className={`border rounded-[32px] p-6 flex flex-col gap-4 transition-all duration-500 ${preferredBrain === 2 ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Brain2 · {preferredBrain === 2 ? 'Primary' : 'Advanced Fallback'}</div>
                        <div className="text-lg font-black text-slate-200">Gemma 3-1B</div>
                        <div className="text-[10px] text-slate-400">Q4_K_M · ~768 MB · Advanced quality</div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${brain2Ready ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'}`}>
                        <Cpu size={18} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Format', value: 'GGUF/WASM' },
                        { label: 'Quant', value: 'Q4_0' },
                        { label: 'Size', value: '~722 MB' },
                        { label: 'RAM needed', value: '~1.8 GB' },
                        { label: 'Context', value: '2048 tokens' },
                        { label: 'Threads', value: 'Optimized (1)' },
                      ].map((item, i) => (
                        <div key={i} className="p-2 bg-white/5 rounded-xl">
                          <div className="text-[8px] font-black text-slate-500 uppercase">{item.label}</div>
                          <div className="text-[10px] font-bold text-slate-300">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[9px] text-slate-400">Download progress</span>
                        <span className={`text-[9px] font-black uppercase ${brain2Ready ? 'text-amber-400' : 'text-slate-500'}`}>
                          {brain2Ready ? 'LOADED' : brain2Progress > 0 && brain2Progress < 100 ? `${brain2Progress}%` : 'NOT LOADED'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-amber-500" animate={{ width: `${brain2Progress}%` }} transition={{ ease: 'easeOut' }} />
                      </div>
                      <div className="text-[8px] text-slate-500 italic">{brain2Message}</div>
                    </div>

                    <button
                      onClick={handleDownloadBrain2}
                      disabled={isBrain2Downloading}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isBrain2Downloading
                        ? <><RotateCcw size={14} className="animate-spin" /> Downloading...</>
                        : brain2Ready
                          ? <><RotateCcw size={14} /> Reload Brain2</>
                          : <><Download size={14} /> Download Brain2</>
                      }
                    </button>

                    {brain2Ready && (
                      <div className="flex flex-col gap-2">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-[9px] font-bold text-center uppercase tracking-widest flex items-center justify-center gap-2">
                          <CheckCircle size={12} /> Brain2 Active · CPU/WASM
                        </div>
                        <button
                          onClick={() => handleSetPreferredBrain(2)}
                          disabled={preferredBrain === 2}
                          className={`w-full py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                            preferredBrain === 2
                              ? 'bg-amber-500 text-black cursor-default'
                              : 'bg-white/5 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400 border border-white/5'
                          }`}
                        >
                          {preferredBrain === 2 ? 'Current Primary' : 'Set as Primary'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom info */}
                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">How it works</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-slate-400">
                    <div className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />Brain1: Qwen 0.8B — ultra-low latency; Brain2: Gemma 3 1B — high intelligence</div>
                    <div className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />Select "Primary" to set preferred model; failover is automatic</div>
                    <div className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />Downloads once, cached in browser IndexedDB — fully offline</div>
                    <div className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />No WebGPU needed; runs optimizations on your device's CPU</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Nexus Link Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-4">
        <AnimatePresence>
          {voiceAiOn && (
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.9 }}
              className="bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 w-[400px] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    voiceAiStatus === 'listening' ? 'bg-red-500' : 
                    voiceAiStatus === 'thinking' ? 'bg-amber-500' : 
                    voiceAiStatus === 'speaking' || voiceAiStatus.includes('Speaking') || voiceAiStatus.includes('Answering') ? 'bg-emerald-500' : 'bg-slate-500'
                  }`} />
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {voiceAiStatus === 'listening' ? 'Nexus Listening' : 
                     voiceAiStatus === 'thinking' ? 'Nexus Processing' : 
                     voiceAiStatus.includes('Answering') || voiceAiStatus.includes('Speaking') ? voiceAiStatus : 'Nexus Ready'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white/5 rounded-lg p-0.5 mr-2">
                    <button 
                      onClick={() => setVoiceLang('en-US')}
                      className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${voiceLang === 'en-US' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      EN
                    </button>
                    <button 
                      onClick={() => setVoiceLang('ml-IN')}
                      className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${voiceLang === 'ml-IN' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      ML
                    </button>
                  </div>
                  {voiceAiStatus === 'speaking' && (
                    <div className="flex gap-0.5 items-end h-3 mr-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          className="w-0.5 bg-emerald-500 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      if (recognitionRef.current) {
                        try { recognitionRef.current.stop(); } catch(e) {}
                      }
                      startVoiceAi();
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-indigo-400 transition-all"
                    title="Restart Microphone"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    onClick={stopVoiceAi}
                    className="p-2 bg-white/5 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all flex items-center gap-2"
                    title="Close Conversation"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest px-1">Close</span>
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-3">
                  <VoiceVisualizer 
                    volume={micLevel / 128} 
                    isModelSpeaking={voiceAiStatus === 'speaking' || voiceAiStatus.includes('Answering') || voiceAiStatus.includes('Speaking')} 
                    isThinking={!['idle', 'listening', 'speaking'].includes(voiceAiStatus) && !voiceAiStatus.includes('Speaking')}
                    isConnected={voiceAiOn} 
                  />
                  <div className="text-sm font-medium text-white italic text-center w-full">
                    {voiceAiStatus === 'listening' && voiceAiTranscript === "Listening..." ? "Speak now..." : `"${voiceAiTranscript}"`}
                  </div>
                </div>
                {voiceAiReply && (
                  <div className="text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3 flex justify-between items-start gap-4">
                    <div className="flex-1">{voiceAiReply}</div>
                    <button 
                      onClick={() => speakResponse({ text: voiceAiReply, model: "NEXUS AI" })}
                      className="p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                      title="Replay Audio"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => {
              setView('read');
              if (scanPhase !== 'live') startScan();
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              view === 'read' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Camera size={20} />
          </button>
          <button 
            onClick={voiceAiOn ? stopVoiceAi : startVoiceAi}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all relative ${
              voiceAiOn ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
            }`}
          >
            {voiceAiOn ? <X size={24} /> : <Mic size={24} />}
            {voiceAiOn && (
              <motion.div 
                layoutId="mic-glow"
                className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"
              />
            )}
          </button>
          <div className="flex flex-col">
            <div className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">NEXUS LINK</div>
            <div className="text-[10px] font-black uppercase flex items-center gap-1.5">
              {voiceAiOn ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-500">ACTIVE</span>
                  <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${Math.min(100, (micLevel / 128) * 100)}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-slate-500">READY</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Call Overlay */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 right-10 w-80 bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-[200]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse"><Volume2 size={24} /></div>
              <div>
                <div className="font-bold">{incomingCall.clientName}</div>
                <div className="text-xs text-slate-500">Incoming Call...</div>
              </div>
            </div>
            {isAnswering ? (
              <div className="text-center text-emerald-500 font-bold text-sm animate-pulse">AI Answering...</div>
            ) : (
              <div className="flex gap-3">
                <button onClick={handleAutoAnswer} className="flex-1 py-3 bg-emerald-600 rounded-xl font-bold text-sm">Answer</button>
                <button onClick={() => setIncomingCall(null)} className="flex-1 py-3 bg-red-600 rounded-xl font-bold text-sm">Decline</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlarged Element Modal */}
      <AnimatePresence>
        {enlargedElement && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[400] flex items-center justify-center p-10">
            <div className="max-w-5xl w-full h-full bg-slate-900 border border-white/10 rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em]">
                  {enlargedElement === 'facts' && "ENLARGED: FACT OF THE CASE"}
                  {enlargedElement === 'model' && "ENLARGED: MODEL DRAFT / TEMPLATE"}
                  {enlargedElement === 'pad' && "ENLARGED: TEMPORARY WRITING PAD"}
                </div>
                <button onClick={() => setEnlargedElement(null)} className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-black/20">
                {enlargedElement === 'facts' && (
                  <textarea 
                    value={draftFacts} 
                    onChange={e => setDraftFacts(e.target.value)}
                    className="w-full h-full bg-transparent text-lg text-slate-300 font-serif leading-relaxed outline-none resize-none"
                    placeholder="Enter facts..."
                    autoFocus
                  />
                )}
                {enlargedElement === 'model' && (
                  <textarea 
                    value={draftModel} 
                    onChange={e => setDraftModel(e.target.value)}
                    className="w-full h-full bg-transparent text-lg text-slate-300 font-serif leading-relaxed outline-none resize-none"
                    placeholder="Enter model draft..."
                    autoFocus
                  />
                )}
                {enlargedElement === 'pad' && (
                  <div 
                    className="w-full h-full bg-transparent text-xl text-slate-300 font-serif leading-relaxed outline-none whitespace-pre-wrap"
                    contentEditable 
                    suppressContentEditableWarning 
                    onBlur={(e) => setDraftPages([e.currentTarget.innerText])}
                    autoFocus
                  >
                    {draftPages[0]}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  {enlargedElement === 'facts' && (
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={voiceAiOn ? stopVoiceAi : startVoiceAi}
                          className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white transition-all relative ${
                            voiceAiOn ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                          }`}
                        >
                          {voiceAiOn ? <X size={28} /> : <Mic size={28} />}
                          {voiceAiOn && (
                            <motion.div 
                              layoutId="mic-glow-modal"
                              className="absolute inset-0 rounded-2xl bg-red-500/20 animate-ping"
                            />
                          )}
                        </button>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dictate Story</span>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={() => {
                            setEnlargedElement(null);
                            setView('read');
                            if (scanPhase !== 'live') startScan();
                          }}
                          className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Camera size={28} />
                        </button>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scan Facts</span>
                      </div>

                      {voiceAiOn ? (
                        <div className="flex flex-col ml-4">
                          <div className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">STORYTELLING ACTIVE</div>
                          <div className="text-sm text-emerald-500 font-bold animate-pulse max-w-md truncate">
                            {voiceAiTranscript === "Listening..." ? "Narrate your case facts now..." : voiceAiTranscript}
                          </div>
                        </div>
                      ) : (
                        <div className="ml-4 hidden md:block">
                          <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">Quick Tip</div>
                          <div className="text-xs text-slate-400 italic">"Use the mic to narrate the story of the case. AI will append it to the facts."</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  {enlargedElement === 'pad' && (
                    <>
                      <button onClick={() => handleCopy(draftPages[0])} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <Copy size={16} /> Copy Content
                      </button>
                      <button onClick={() => handleDownloadDraft(draftPages[0])} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <Download size={16} /> Download Draft
                      </button>
                    </>
                  )}
                  <button onClick={() => setEnlargedElement(null)} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[40px] p-10 text-center">
              <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8"><span className="text-4xl font-black italic text-black">N</span></div>
              <h2 className="text-3xl font-black italic mb-4">Nexus Justice</h2>
              <p className="text-slate-400 mb-10 leading-relaxed">Your AI-powered legal command center. Manage calls, consult laws, and draft documents seamlessly.</p>
              <button onClick={() => setShowOnboarding(false)} className="w-full py-5 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest">Enter Portal</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
