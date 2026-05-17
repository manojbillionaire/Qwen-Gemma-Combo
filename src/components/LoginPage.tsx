import React, { useState } from 'react';
import { Shield, User, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mock authentication logic
    setTimeout(() => {
      if (email === 'advocate@nexus.com' && password === 'advocate123') {
        onLogin({ email, role: 'advocate', name: 'Advocate User' });
      } else {
        setError('Invalid credentials. Use advocate@nexus.com/advocate123');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0 atmosphere pointer-events-none opacity-40" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">NEXUS <span className="text-indigo-500">JUSTICE</span></h1>
          <p className="text-slate-400 text-sm">Secure Portal Login</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          {/* Development Shortcuts at the top for visibility */}
          <div className="mb-8 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
            <div className="text-[10px] uppercase tracking-widest font-black text-orange-400/60 mb-3 text-center">
              Dev Shortcut
            </div>
            <button 
              type="button"
              onClick={() => onLogin({ email: 'advocate@nexus.com', role: 'advocate', name: 'Advocate User' })}
              className="w-full bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-black uppercase tracking-widest py-2.5 rounded-xl text-[9px] flex items-center justify-center gap-2 transition-all"
            >
              Quick Login as Advocate <ArrowRight size={10} />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-black ml-1">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexus.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-indigo-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-black ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-indigo-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[11px] text-red-400 text-center"
              >
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
            Authorized Personnel Only
          </p>
        </div>
      </motion.div>
    </div>
  );
}
