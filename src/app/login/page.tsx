'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Tentando login para:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no Supabase Auth:', error);
        throw error;
      }

      console.log('Login bem-sucedido:', data);
      // Use window.location.href to ensure a full reload and cookie sync with middleware
      window.location.href = '/';
    } catch (err: any) {
      console.error('Catch Login Error:', err);
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative group">
          {/* Subtle Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-[3rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
          
          <div className="relative space-y-10">
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center justify-center mb-4">
                <img src="/icons/icon.svg" className="w-24 h-24 object-contain contrast-125" alt="Logo" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                  Post<span className="text-blue-500">Imobiliário</span>
                </h1>
                <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">Acesso Administrativo</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="E-mail"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium placeholder:text-white/20"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Senha"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium placeholder:text-white/20"
                  />
                </div>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm font-bold tracking-wide text-center bg-red-500/10 border border-red-500/20 py-3 rounded-xl"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-30 py-6 rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-white/20 font-bold uppercase tracking-widest">
              Elite Experience 2026 • Premium Access
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
