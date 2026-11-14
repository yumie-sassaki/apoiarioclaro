'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { SiteFooter } from '@/components/SiteFooter';
import { 
  HeartHandshake, 
  QrCode, 
  MapPin, 
  Ticket, 
  MessageCircle, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function ComoContribuirPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <Logo href="/" iconSize={40} textSize="text-xl sm:text-2xl" textClassName="hidden sm:inline-block" priority />

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Voltar às campanhas</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* Título Principal */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Como ajudar com segurança
            </h1>
            <p className="mt-2 text-stone-600 text-sm sm:text-base max-w-3xl leading-relaxed">
              Escolha uma campanha, confira as orientações e ajude diretamente a organização responsável.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0D4183] hover:bg-[#08356D] transition-colors shrink-0 self-start lg:self-auto"
          >
            <span>Ver campanhas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Garantia do Pix Verificado */}
        <div className="rounded-3xl border border-[#B9D4FA] bg-[#EDF5FF] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl border border-[#B9D4FA] bg-white text-[#0D4183] flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0D4183]">
                Pix direto e verificado
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-0.5">
                A chave pertence à instituição e passa por conferência antes de ser publicada.
              </p>
            </div>
          </div>

          <ul className="mt-6 grid grid-cols-1 gap-4 border-t border-[#B9D4FA] pt-5 md:grid-cols-3 md:gap-6">
            <li className="flex gap-2.5 text-sm text-stone-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2575D0]" />
              <span><strong className="text-[#0D4183]">Direto para a organização.</strong> Sem taxas ou intermediários.</span>
            </li>
            <li className="flex gap-2.5 text-sm text-stone-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2575D0]" />
              <span><strong className="text-[#0D4183]">Dados conferidos.</strong> Só instituições verificadas publicam.</span>
            </li>
            <li className="flex gap-2.5 text-sm text-stone-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2575D0]" />
              <span><strong className="text-[#0D4183]">Confirme no banco.</strong> Veja a titularidade antes do Pix.</span>
            </li>
          </ul>
        </div>

        {/* Grade com os 4 Tipos de Apoio */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-4">
            Formas de ajudar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Doações Físicas */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF4F1] text-[#E04F33] flex items-center justify-center shrink-0 mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  Alimentos e Agasalhos
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Veja o ponto de coleta, os horários e o que a organização precisa.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                Entrega presencial no local indicado
              </div>
            </div>

            {/* Card 2: Adesões */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF4F1] text-[#E04F33] flex items-center justify-center shrink-0 mb-3">
                  <Ticket className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  Adesões e Almoços Solidários
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Veja o valor, pague por Pix e envie o comprovante à instituição.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                Comprovante enviado no WhatsApp
              </div>
            </div>

            {/* Card 3: Cartinhas de Natal */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF4F1] text-[#E04F33] flex items-center justify-center shrink-0 mb-3">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  Cartinhas e Apadrinhamento
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Escolha uma cartinha, combine com a instituição e entregue dentro do prazo.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                Prazos e orientações detalhadas
              </div>
            </div>

            {/* Card 4: Contato Direto */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FFF4F1] text-[#E04F33] flex items-center justify-center shrink-0 mb-3">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  Contato e Informações
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  Tire dúvidas ou saiba como ser voluntário pelo contato da organização.
                </p>
              </div>
              <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                WhatsApp e telefone abertos
              </div>
            </div>

          </div>
        </div>

        {/* Prestação de Contas */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-3xl">
            <h3 className="text-xl font-bold text-stone-900">
              Acompanhe os resultados
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Depois de cada ação, a instituição pode publicar fotos, entregas e o resultado alcançado.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 w-full md:w-auto">
            <Link
              href="/"
              className="w-full md:w-auto text-center px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-colors whitespace-nowrap"
            >
              Ver campanhas →
            </Link>
          </div>
        </div>

      </main>

      <SiteFooter />

    </div>
  );
}
