'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, HelpCircle, Mail, X } from 'lucide-react';

const SUPPORT_EMAIL = 'apoiarioclaro@gmail.com';

export function HelpSupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = SUPPORT_EMAIL;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setCopied(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Preciso de ajuda"
        aria-label="Preciso de ajuda"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
      >
        <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
        <span className="hidden sm:inline">Ajuda</span>
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-support-title"
              className="w-full max-w-md rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-7 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF8F5] border border-[#F3DFD8] text-[#E04F33]">
                  <HelpCircle className="h-5 w-5" />
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Fechar janela de ajuda"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h2
                id="help-support-title"
                className="mt-4 text-xl font-bold text-stone-900 font-display"
              >
                Precisa de ajuda?
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Se tiver qualquer dúvida sobre como publicar campanhas, registrar resultados ou
                atualizar os dados da sua instituição, fale diretamente com a equipe do Apoia Rio
                Claro.
              </p>

              <div className="mt-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 p-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  E-mail de contato
                </span>
                <p className="mt-1 text-base font-bold text-stone-900 select-all break-all">
                  {SUPPORT_EMAIL}
                </p>

                <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700">E-mail copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-stone-500" />
                        <span>Copiar e-mail</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E04F33] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#C84228] transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Enviar e-mail</span>
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
