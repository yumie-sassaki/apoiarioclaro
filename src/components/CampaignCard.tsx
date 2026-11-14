'use client';

import React from 'react';
import { Campaign } from '@/types';
import { Eye } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  onOpenDetails: (campaign: Campaign) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onOpenDetails }) => {
  return (
    <div 
      onClick={() => onOpenDetails(campaign)}
      className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:border-stone-300 hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer group"
    >
      {/* Imagem de Capa com apenas 1 tag discreta da categoria */}
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Única tag discreta no canto superior esquerdo */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-xs text-stone-900 text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
            {campaign.categoryLabel}
          </span>
        </div>
      </div>

      {/* Corpo do Card Limpo e Direto */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Nome da Instituição e Bairro */}
          <p className="text-xs font-bold text-[#E04F33] truncate">
            {campaign.organizationName} · {campaign.neighborhood}
          </p>

          {/* Título da Campanha */}
          <h3 className="mt-1 text-lg font-bold text-stone-900 line-clamp-2 leading-snug">
            {campaign.title}
          </h3>
        </div>

        {/* Rodapé único e enxuto */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-normal">
            <Eye className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{campaign.viewsCount || 0} visualizações</span>
          </div>

          <div className="flex items-center gap-1">
            <span>Até {new Date(campaign.deadlineDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
            <span className="font-semibold text-[#0D4183] ml-1 group-hover:text-[#2575D0] transition-colors">
              Ver como ajudar →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
