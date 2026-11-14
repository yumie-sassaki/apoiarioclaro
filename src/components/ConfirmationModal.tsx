'use client';

import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmationModal({ isOpen, title, description, confirmLabel, isConfirming = false, onCancel, onConfirm }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
      <section className="w-full max-w-md rounded-t-3xl border border-stone-200 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700"><AlertTriangle className="h-5 w-5" /></div>
          <button type="button" onClick={onCancel} disabled={isConfirming} aria-label="Fechar" className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"><X className="h-5 w-5" /></button>
        </div>
        <h2 id="confirmation-title" className="mt-4 text-xl font-bold text-stone-900 font-display">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isConfirming} className="h-11 rounded-xl px-4 text-sm font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={isConfirming} className="h-11 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60">{isConfirming ? 'Confirmando…' : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
