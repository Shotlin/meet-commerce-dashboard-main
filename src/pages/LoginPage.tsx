import React, { useState } from 'react';
import { Flame, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const ok = await login(email.trim(), password);
    setIsSubmitting(false);
    if (ok) {
      const from = (location.state as { from?: string } | null)?.from || '/';
      navigate(from, { replace: true });
    } else {
      setError('Invalid local admin credentials. Check the email and password, then try again.');
    }
  };

  return (
    <main className="min-h-screen bg-[#130d16] text-rose-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-[28px] border border-rose-100/10 bg-[#1d1422] shadow-2xl">
        <section className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#3b102d] via-[#28142b] to-[#130d16] overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-raspberry/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-raspberry to-brand-berry flex items-center justify-center shadow-lg">
                <Flame className="h-6 w-6 text-white fill-current" />
              </div>
              <div>
                <p className="text-sm font-black tracking-[0.2em] text-white">MEET COMMERCE</p>
                <p className="text-[10px] font-bold tracking-[0.24em] text-rose-200/70">LOCAL HQ CONSOLE</p>
              </div>
            </div>
            <div className="mt-24 max-w-md">
              <p className="text-xs font-black tracking-[0.24em] text-rose-200/70">OPERATIONS CORE</p>
              <h1 className="mt-4 text-5xl font-black leading-[0.96] tracking-tight text-white">See the whole cold-chain at a glance.</h1>
              <p className="mt-6 text-sm leading-7 text-rose-100/70">Use the local seeded workspace to explore orders, warehouse QC, inventory lots, vendors, finance, and governance with real API-backed data.</p>
            </div>
          </div>
          <div className="relative flex items-center gap-3 text-xs font-bold text-rose-100/60">
            <ShieldCheck className="h-4 w-4 text-brand-raspberry" />
            Local development credentials only
          </div>
        </section>

        <section className="p-8 sm:p-12 bg-[#fff9fc] text-ink">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-raspberry to-brand-berry flex items-center justify-center">
              <Flame className="h-5 w-5 text-white fill-current" />
            </div>
            <p className="text-sm font-black tracking-[0.18em]">MEET COMMERCE</p>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-berry">HQ access</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Sign in to the local console</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Use one of the seeded local admin accounts to inspect role-based dashboard access.</p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Email</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-brand-raspberry focus-within:ring-4 focus-within:ring-brand-raspberry/10">
                <Mail className="h-4 w-4 text-brand-berry" />
                <input className="w-full bg-transparent py-3 text-sm outline-none" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@bakaloo.com" required />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Password</span>
              <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-brand-raspberry focus-within:ring-4 focus-within:ring-brand-raspberry/10">
                <LockKeyhole className="h-4 w-4 text-brand-berry" />
                <input className="w-full bg-transparent py-3 text-sm outline-none" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Local password" required />
              </span>
            </label>
            {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</p>}
            <button className="w-full rounded-2xl bg-gradient-to-r from-brand-raspberry to-brand-berry px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-berry/20 transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating…' : 'Enter HQ console'}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">API: http://localhost:4500 · Dashboard: http://localhost:4501</p>
        </section>
      </div>
    </main>
  );
};
