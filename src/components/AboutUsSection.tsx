'use client';

import React from 'react';
import { BrandName } from '@/components/Logo';
import { 
  Target, 
  ShieldCheck, 
  Eye
} from 'lucide-react';

interface AboutUsSectionProps {
  onGoToCampaigns: () => void;
  onOpenRegisterOrg: () => void;
}

export const AboutUsSection: React.FC<AboutUsSectionProps> = ({
  onGoToCampaigns,
  onOpenRegisterOrg
}) => {
  return (
    <div className="space-y-8 py-2">
      
      {/* Hero Sobre Nós */}
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          Como funciona o <BrandName />
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Reunimos em um só lugar as campanhas de instituições verificadas de Rio Claro. Aqui você descobre o que cada organização precisa e colabora diretamente com ela, sem taxas ou intermediários.
        </p>
      </div>

      {/* Bloco 2: Nossos 3 Compromissos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[#FFF4F1] border border-[#FCDAD1] text-[#E04F33] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Ajuda direta</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Pix e pontos de entrega são sempre da própria organização. Não cobramos taxa nem ficamos com parte da doação.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[#FFF4F1] border border-[#FCDAD1] text-[#E04F33] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Organizações verificadas</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Só organizações com sede em Rio Claro e dados conferidos podem publicar campanhas.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[#FFF4F1] border border-[#FCDAD1] text-[#E04F33] flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Resultados visíveis</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Depois de cada ação, a instituição pode mostrar entregas, fotos e o resultado alcançado.
          </p>
        </div>
      </div>

      {/* Bloco 3: Chamada para Ação (Sólido Preto Carvão) */}
      <div className="rounded-3xl border border-[#B9D4FA] bg-[#F5F9FF] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold text-[#0D4183]">
            Você representa uma obra social em Rio Claro?
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
            Cadastre sua instituição para divulgar campanhas e alcançar mais pessoas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={onOpenRegisterOrg}
            className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-colors cursor-pointer whitespace-nowrap"
          >
            Cadastrar minha organização
          </button>
          <button
            onClick={onGoToCampaigns}
            className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-[#0D4183] border border-[#B9D4FA] bg-white hover:bg-[#EAF2FF] transition-colors cursor-pointer whitespace-nowrap"
          >
            Ver campanhas →
          </button>
        </div>
      </div>

    </div>
  );
};
