'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';

export default function RecuperarAcessoPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Informe o e-mail usado no cadastro da organização.');
      return;
    }
    if (!supabase) {
      setError('O acesso seguro ainda não está configurado. Tente novamente mais tarde.');
      return;
    }

    setIsSubmitting(true);
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/primeiro-acesso`
    });
    setIsSubmitting(false);

    if (recoveryError) {
      setError('Não foi possível enviar o link agora. Tente novamente em alguns minutos.');
      return;
    }

    // A mesma confirmação para todos os e-mails evita revelar quais contas existem.
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <Logo href="/" iconSize={42} textSize="text-2xl" priority />
        <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8">
          {submitted ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" />
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-display">Confira seu e-mail</h1>
              <p className="text-sm leading-relaxed text-stone-600">
                Se houver uma conta aprovada com esse e-mail, você receberá um link para criar uma nova senha.
              </p>
              <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0D4183] px-5 text-sm font-bold text-white hover:bg-[#09356d]">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0D4183]">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-display">Recuperar acesso</h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Não conseguiu criar sua senha ou o convite expirou? Informe o e-mail da pessoa responsável pela organização para receber um novo link.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">E-mail da organização</span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contato@organizacao.org.br" className="h-11 w-full rounded-xl border border-stone-300 pl-9 pr-3 text-sm focus:border-stone-900 focus:outline-hidden" required />
                  </span>
                </label>
                <button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-[#E04F33] text-sm font-bold text-white hover:bg-[#C84127] disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? 'Enviando...' : 'Enviar novo link'}
                </button>
              </form>
              <Link href="/login" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
