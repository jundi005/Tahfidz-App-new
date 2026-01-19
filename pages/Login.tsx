
import React, { useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Updated URL with the direct image link
const LOGO_URL = "https://i.ibb.co.com/KcYyzZRz/Tanpa-judul-1080-x-1080-piksel-20260116-084021-0000.png";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            setMessage('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // The onAuthStateChange in App.tsx will handle the redirect
        }
    } catch (error: any) {
        setError(error.error_description || error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-primary rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col items-center text-center">
            <div className="mb-4 w-28 h-28">
                <img 
                    src={LOGO_URL} 
                    alt="Logo Ma'had" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                         (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Logo";
                    }}
                />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Tahfidz App</h1>
            <p className="text-sm text-slate-500">Lajnah Al-Quran</p>
        </div>

        <div>
            <div className="flex border-b border-slate-200">
                <button onClick={() => { setIsSignUp(false); setError(''); setMessage('');}} className={`w-1/2 pb-3 text-center font-semibold text-sm transition-colors ${!isSignUp ? 'text-secondary border-b-2 border-secondary' : 'text-slate-500 hover:text-slate-700'}`}>
                    Login
                </button>
                <button onClick={() => { setIsSignUp(true); setError(''); setMessage('');}} className={`w-1/2 pb-3 text-center font-semibold text-sm transition-colors ${isSignUp ? 'text-secondary border-b-2 border-secondary' : 'text-slate-500 hover:text-slate-700'}`}>
                    Daftar
                </button>
            </div>
        </div>


        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
               <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                 <Mail className="h-5 w-5 text-slate-400" />
               </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-slate-300 py-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                 <KeyRound className="h-5 w-5 text-slate-400" />
               </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-slate-300 py-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-secondary sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-center text-error">{error}</p>}
          {message && <p className="text-sm text-center text-success">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-secondary py-2.5 px-4 text-sm font-semibold text-white hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors disabled:bg-slate-400"
            >
              {loading ? 'Memproses...' : (isSignUp ? 'Daftar' : 'Login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
