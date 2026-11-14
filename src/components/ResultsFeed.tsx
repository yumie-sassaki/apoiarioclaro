'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Campaign } from '@/types';
import { Building2, CheckCircle2, Heart, Quote } from 'lucide-react';
import { getStoredHeartedCampaigns, toggleStoredHeartedCampaign } from '@/lib/storage';

interface ResultsFeedProps {
  completedCampaigns: Campaign[];
}

function formatCompletedDate(value?: string): string {
  if (!value) return 'Recentemente';
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
}

export const ResultsFeed: React.FC<ResultsFeedProps> = ({ completedCampaigns }) => {
  const [heartedIds, setHeartedIds] = useState<string[]>([]);

  useEffect(() => {
    setHeartedIds(getStoredHeartedCampaigns());
  }, []);

  const handleToggleHeart = (campaignId: string) => {
    const next = toggleStoredHeartedCampaign(campaignId);
    setHeartedIds(next);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
      <header className="max-w-2xl space-y-1.5">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-900">
          Resultados
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          Acompanhe as entregas e conquistas que a comunidade ajudou a tornar possíveis.
        </p>
      </header>

      {/* Lista de Ações Concluídas */}
      <div className="space-y-6">
        {completedCampaigns.length === 0 ? (
          <div className="mx-auto max-w-md py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF2FF] text-[#2575D0]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-stone-800">Os primeiros resultados aparecerão aqui</h2>
            <p className="mt-1.5 text-sm text-stone-500">
              Quando uma campanha for concluída, a organização poderá compartilhar o que foi realizado.
            </p>
          </div>
        ) : (
          completedCampaigns.map((camp) => {
            const isHearted = heartedIds.includes(camp.id);
            return (
              <div
                key={camp.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs p-6 sm:p-8"
              >
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Imagem de Entrega / Comprovação */}
                  {camp.resultReport?.photoUrl && (
                    <div className="w-full lg:w-72 h-52 rounded-2xl overflow-hidden shrink-0 bg-stone-100">
                      <img
                        src={camp.resultReport.photoUrl}
                        alt={camp.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Dados do Resultado */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF4F1] text-[#E04F33] border border-[#FCDAD1] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ação Concluída
                        </span>
                        <span className="text-xs text-stone-400">
                          Finalizada em {formatCompletedDate(camp.resultReport?.completedAt)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-stone-900">
                        {camp.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#E04F33] flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {camp.organizationName}
                      </p>
                    </div>

                    {/* Destaque do Total Arrecadado */}
                    {camp.resultReport?.totalCollected && (
                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                          Resultado alcançado pela comunidade:
                        </span>
                        <p className="text-base sm:text-lg font-bold text-stone-900 mt-0.5">
                          {camp.resultReport.totalCollected}
                        </p>
                        <p className="text-xs text-stone-600 mt-1.5">
                          {camp.resultReport.achievedSummary}
                        </p>
                      </div>
                    )}

                    {/* Depoimento / Mensagem de Agradecimento */}
                    {camp.resultReport?.testimonial && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs sm:text-sm italic">
                        <Quote className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                        <p>{camp.resultReport.testimonial}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/resultados/${camp.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-[#0D4183] px-4 py-2.5 text-sm font-bold text-[#0D4183] hover:bg-[#EAF2FF] transition-colors"
                      >
                        Ver resultado completo
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleHeart(camp.id)}
                        aria-pressed={isHearted}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                          isHearted
                            ? 'border-[#F3DFD8] bg-[#FFF8F5] text-[#E04F33]'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isHearted ? 'fill-[#E04F33] text-[#E04F33]' : 'text-stone-400'}`} />
                        <span>{isHearted ? 'Amei' : 'Dar amei'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
