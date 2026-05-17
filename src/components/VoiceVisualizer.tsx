import { motion } from 'motion/react';

interface VoiceVisualizerProps {
  volume: number;
  isModelSpeaking: boolean;
  isConnected: boolean;
  isThinking?: boolean;
}

export function VoiceVisualizer({ volume, isModelSpeaking, isConnected, isThinking }: VoiceVisualizerProps) {
  const bars = Array.from({ length: 20 });
  
  return (
    <div className="flex items-center justify-center gap-1 h-32 w-full">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full ${
            isModelSpeaking 
              ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' 
              : isThinking
                ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                : isConnected 
                  ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                  : 'bg-white/20'
          }`}
          animate={{
            height: isConnected 
              ? (isModelSpeaking ? [20, 80, 40, 60, 20] : isThinking ? [30, 30, 30] : [10, 10 + volume * 200, 10]) 
              : 4,
            opacity: isConnected ? (isThinking ? [0.4, 1, 0.4] : 1) : 0.3
          }}
          transition={{
            duration: isModelSpeaking ? 0.5 + Math.random() * 0.5 : isThinking ? 1.5 : 0.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * (isThinking ? 0.1 : 0.05)
          }}
        />
      ))}
    </div>
  );
}
