import React from 'react';
import { Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';

export const SiteFooter: React.FC = () => (
  <footer className="mt-auto w-full border-t border-stone-200 bg-white py-8 pb-24 md:pb-8">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md space-y-2.5">
          <Logo href="/" iconSize={32} textSize="text-lg sm:text-xl" />
          <p className="text-xs sm:text-sm leading-relaxed text-stone-600">
            Feito com carinho para aproximar quem quer ajudar de quem cuida da nossa cidade.
          </p>
        </div>

        <div className="space-y-1.5 md:text-right">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Fale com a gente
          </p>
          <a
            href="mailto:apoiarioclaro@gmail.com"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-[#FAF8F5] px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 transition-colors hover:border-[#F3DFD8] hover:bg-[#FFF8F5] hover:text-[#E04F33]"
          >
            <Mail className="h-4 w-4 shrink-0 text-[#E04F33]" />
            <span>apoiarioclaro@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
