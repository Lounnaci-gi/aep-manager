
import React, { useState, useEffect } from 'react';
import { DbService } from '../services/dbService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Check for existing block on mount
  useEffect(() => {
    const storedBlock = localStorage.getItem('aep_blocked_until');
    if (storedBlock) {
      const blockTime = parseInt(storedBlock, 10);
      if (blockTime > Date.now()) {
        setBlockedUntil(blockTime);
      } else {
        localStorage.removeItem('aep_blocked_until');
        localStorage.removeItem('aep_failed_attempts');
      }
    }
    
    const storedAttempts = localStorage.getItem('aep_failed_attempts');
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!blockedUntil) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, blockedUntil - Date.now());
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        setBlockedUntil(null);
        setAttempts(0);
        localStorage.removeItem('aep_blocked_until');
        localStorage.removeItem('aep_failed_attempts');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if blocked
    if (blockedUntil && blockedUntil > Date.now()) {
      setError('Compte temporairement bloqué. Veuillez patienter.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await DbService.authenticate(username, password);
    
    if (result.user) {
      // Successful login - reset attempts
      localStorage.removeItem('aep_failed_attempts');
      localStorage.removeItem('aep_blocked_until');
      onLogin(result.user);
    } else {
      // Failed attempt
      if (result.blocked) {
        // Block from backend
        if (result.blockedUntil) {
          setBlockedUntil(result.blockedUntil);
          localStorage.setItem('aep_blocked_until', result.blockedUntil.toString());
        }
        setError(result.error || 'Compte temporairement bloqué.');
      } else {
        // Normal failed attempt
        const newAttempts = (result.remainingAttempts !== undefined) 
          ? MAX_ATTEMPTS - result.remainingAttempts 
          : attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('aep_failed_attempts', newAttempts.toString());
        
        if (result.remainingAttempts !== undefined && result.remainingAttempts <= 0) {
          // Block after max attempts
          const blockTime = Date.now() + BLOCK_DURATION;
          setBlockedUntil(blockTime);
          localStorage.setItem('aep_blocked_until', blockTime.toString());
          setError('Trop de tentatives échouées. Accès bloqué pour 15 minutes.');
        } else {
          setError(result.error || 'Identifiants incorrects.');
        }
      }
    }
    setLoading(false);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">AEP Manager</h2>
          <p className="text-blue-200 text-sm font-medium mt-1">Connexion à la base GestionEau</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className={`${blockedUntil ? 'bg-orange-500/30 border-orange-500/50' : 'bg-red-500/20 border-red-500/50'} border text-xs p-3 rounded-lg text-center font-bold uppercase tracking-widest animate-shake`}>
              {error}
            </div>
          )}
          
          {blockedUntil && remainingTime > 0 && (
            <div className="bg-orange-500/20 border border-orange-500/50 text-orange-300 text-xs p-3 rounded-lg text-center">
              <p className="font-black text-lg mb-1">{formatTime(remainingTime)}</p>
              <p className="text-[10px] uppercase">avant de réessayer</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1.5 ml-1">Utilisateur</label>
              <input 
                type="text" 
                required
                disabled={!!blockedUntil}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm disabled:opacity-30"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1.5 ml-1">Mot de passe</label>
              <input 
                type="password" 
                required
                disabled={!!blockedUntil}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm disabled:opacity-30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!blockedUntil && attempts > 0 && (
            <div className="text-center text-[10px] text-blue-300 font-bold">
              {MAX_ATTEMPTS - attempts} tentative{Math.abs(MAX_ATTEMPTS - attempts) > 1 ? 's' : ''} restante{Math.abs(MAX_ATTEMPTS - attempts) > 1 ? 's' : ''}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !!blockedUntil}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
          >
            {loading ? 'Connexion...' : blockedUntil ? 'Compte bloqué' : 'Accéder au Dashboard'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">Atlas Secure Access v2.4</p>
        </div>
      </div>
    </div>
  );
};
