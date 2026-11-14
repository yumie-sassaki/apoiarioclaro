'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { fetchUserById } from '@/services/database';

export default function PrimeiroAcessoPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const checkInviteSession = async () => {
      const { data } = await client.auth.getSession();
      const profile = data.session ? await fetchUserById(data.session.user.id) : null;
      const canSetFirstPassword = profile?.role === 'representante';
      setIsReady(canSetFirstPassword);
      if (data.session && !canSetFirstPassword) {
        setError('Este link não está associado a uma organização convidada. Abra o convite recebido pela organização.');
      }
    };
    void checkInviteSession();
    const { data: listener } = client.auth.onAuthStateChange(() => { void checkInviteSession(); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 10) {
      setError('Crie uma senha com pelo menos 10 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!supabase) {
      setError('O acesso seguro ainda não está configurado.');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);
    if (updateError) {
      setError(updateError.message.includes('different') ? 'Escolha uma senha diferente da senha atual.' : 'Não foi possível salvar sua senha. Peça um novo link de acesso.');
      return;
    }
    setMessage('Senha criada com sucesso. Agora você já pode entrar no painel.');
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <Logo href="/" iconSize={42} textSize="text-2xl" priority />
        <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0D4183]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-display">Defina sua senha</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Este é seu primeiro acesso ao painel. Crie uma senha exclusiva para a conta da sua organização.
          </p>

          {!isReady && !message && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              Abra esta página pelo link recebido por e-mail. Se o link expirou, solicite um novo link abaixo.
            </p>
          )}

          {message ? (
            <div className="mt-6 space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="text-sm text-stone-700">{message}</p>
              <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0D4183] px-5 text-sm font-bold text-white hover:bg-[#09356d]">
                Ir para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Nova senha</span>
                <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-stone-900 focus:outline-hidden" required />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Confirmar senha</span>
                <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-stone-900 focus:outline-hidden" required />
              </label>
              <button type="submit" disabled={!isReady || isSaving} className="h-11 w-full rounded-xl bg-[#E04F33] text-sm font-bold text-white hover:bg-[#C84127] disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? 'Salvando...' : 'Criar senha e continuar'}
              </button>
              <Link href="/recuperar-acesso" className="mx-auto flex w-fit items-center justify-center text-sm font-semibold text-[#0D4183] underline-offset-4 hover:underline">
                Reenviar link de acesso
              </Link>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
