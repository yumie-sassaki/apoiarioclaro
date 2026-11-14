'use client';

import React, { useState } from 'react';
import { Campaign, Organization } from '@/types';
import { 
  X, 
  MapPin, 
  Copy, 
  Check, 
  Share2, 
  Ticket, 
  Building2,
  Clock,
  QrCode,
  Target,
  Phone,
  Mail,
  Globe,
  ExternalLink
} from 'lucide-react';
import { parseOrganizationContacts, buildWhatsAppUrl } from '@/lib/masks';

function formatDeadlineDate(dateStr?: string): string {
  if (!dateStr) return '';
  const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('pt-BR');
}

function formatCampaignLocation(location: string, neighborhood: string): string {
  const trimmedLocation = location.trim();
  const trimmedNeighborhood = neighborhood.trim();
  if (!trimmedLocation) {
    return trimmedNeighborhood ? `${trimmedNeighborhood}, Rio Claro - SP` : 'Rio Claro - SP';
  }
  if (trimmedNeighborhood) {
    const escaped = trimmedNeighborhood.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const suffixPattern = new RegExp(`\\s*[—-]\\s*${escaped}$`, 'i');
    const withoutDuplicateSuffix = trimmedLocation.replace(suffixPattern, '');
    if (
      withoutDuplicateSuffix !== trimmedLocation &&
      withoutDuplicateSuffix.toLowerCase().includes(trimmedNeighborhood.toLowerCase())
    ) {
      return withoutDuplicateSuffix;
    }
  }
  return trimmedLocation;
}

interface CampaignDetailModalProps {
  campaign: Campaign | null;
  organization?: Organization | null;
  onClose: () => void;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({ campaign, organization, onClose }) => {
  const [copiedPix, setCopiedPix] = useState(false);

  if (!campaign) return null;

  const handleCopyPix = () => {
    if (!campaign.pixKey) return;
    navigator.clipboard.writeText(campaign.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleShare = () => {
    const message = encodeURIComponent(
      `Solidariedade em Rio Claro: ${campaign.title} - Realizada por ${campaign.organizationName}. Confira em: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  const formattedDeadline = formatDeadlineDate(campaign.deadlineDate);
  const displayLocation = formatCampaignLocation(campaign.location, campaign.neighborhood);
  const contacts = parseOrganizationContacts(organization);
  const hasAnyContact = Boolean(
    contacts.whatsapp || contacts.phone || contacts.email || contacts.instagram || contacts.website
  );
  const whatsappHref = contacts.whatsapp
    ? buildWhatsAppUrl(
        contacts.whatsapp,
        `Olá! Vi a campanha "${campaign.title}" da instituição ${campaign.organizationName} no Apoia Rio Claro e gostaria de saber como posso ajudar.`
      )
    : '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl lg:max-w-5xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in duration-200 flex flex-col">
        
        {/* Barrinha indicadora de arrasto exclusiva no mobile */}
        <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-30 p-2 rounded-full bg-white/90 hover:bg-stone-100 text-stone-700 transition-colors shadow-xs cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Corpo do Modal: Split 2 colunas no desktop, scroll único no mobile */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
          
          {/* Coluna Esquerda: Foto limpa (apenas tag discreta de categoria) */}
          <div className="relative md:w-5/12 h-64 md:h-auto min-h-[240px] md:min-h-[460px] bg-stone-100 flex flex-col justify-between overflow-hidden shrink-0">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Topo da Imagem: Categoria */}
            <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full text-stone-900 bg-white/95 backdrop-blur-xs shadow-xs">
                {campaign.categoryLabel}
              </span>
            </div>
          </div>

          {/* Coluna Direita: Informações Detalhadas e Barra de Ações Exclusiva */}
          <div className="md:w-7/12 flex flex-col flex-1 bg-white justify-between">
            
            {/* Conteúdo com rolagem independente no desktop */}
            <div className="p-5 sm:p-8 space-y-5 overflow-y-auto flex-1">
              {/* Entidade */}
              <div className="flex items-center gap-2 text-xs font-bold text-[#E04F33]">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>{campaign.organizationName}</span>
              </div>

              {/* Título */}
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {campaign.title}
              </h2>

              {/* Descrição */}
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                {campaign.description}
              </p>

              {/* Informações importantes no corpo principal */}
              <div className="rounded-2xl border border-stone-200/80 bg-[#FAF8F5] p-4 space-y-3">
                {campaign.ticketPrice !== undefined && campaign.ticketPrice > 0 && (
                  <div className="flex items-start gap-2.5">
                    <Ticket className="w-4 h-4 text-[#E04F33] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Valor da adesão
                      </span>
                      <span className="text-sm sm:text-base font-bold text-stone-900">
                        {campaign.ticketPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                )}

                {campaign.targetGoal && campaign.targetGoal.target > 0 && (
                  <div className="flex items-start gap-2.5">
                    <Target className="w-4 h-4 text-[#0D4183] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Meta da campanha
                      </span>
                      <span className="text-sm font-bold text-stone-900">
                        {campaign.targetGoal.unit === 'reais'
                          ? campaign.targetGoal.target.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : `${campaign.targetGoal.target} ${campaign.targetGoal.unit}`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#E04F33] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Local / Endereço
                    </span>
                    <span className="text-sm font-medium text-stone-800 whitespace-normal">
                      {displayLocation}
                    </span>
                  </div>
                </div>

                {formattedDeadline && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Prazo / Data limite
                      </span>
                      <span className="text-sm font-medium text-stone-800">
                        Até {formattedDeadline}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {hasAnyContact && (
                <section className="rounded-2xl border border-stone-200/80 bg-[#FAF8F5] p-4 space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Canais de contato da instituição
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {contacts.whatsapp && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-stone-800 hover:text-[#E04F33] font-medium transition-colors min-w-0"
                      >
                        <Phone className="w-4 h-4 text-[#E04F33] shrink-0" />
                        <span className="truncate">WhatsApp: {contacts.whatsapp}</span>
                      </a>
                    )}
                    {contacts.phone && (
                      <a
                        href={`tel:${contacts.phone}`}
                        className="flex items-center gap-2 text-stone-700 hover:text-stone-900 font-medium transition-colors min-w-0"
                      >
                        <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="truncate">Telefone: {contacts.phone}</span>
                      </a>
                    )}
                    {contacts.email && (
                      <a
                        href={`mailto:${contacts.email}`}
                        className="flex items-center gap-2 text-stone-700 hover:text-[#E04F33] font-medium transition-colors min-w-0"
                      >
                        <Mail className="w-4 h-4 text-[#E04F33] shrink-0" />
                        <span className="truncate">{contacts.email}</span>
                      </a>
                    )}
                    {contacts.instagram && (
                      <a
                        href={contacts.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-stone-700 hover:text-[#E04F33] font-medium transition-colors min-w-0"
                      >
                        <ExternalLink className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="truncate">Instagram: {contacts.instagram}</span>
                      </a>
                    )}
                    {contacts.website && (
                      <a
                        href={contacts.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-stone-700 hover:text-[#E04F33] font-medium transition-colors min-w-0"
                      >
                        <Globe className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="truncate">{contacts.website.replace(/^https?:\/\//i, '')}</span>
                      </a>
                    )}
                  </div>
                </section>
              )}

              {campaign.saleLocations && campaign.saleLocations.length > 0 && (
                <section className="rounded-2xl border border-[#B9D4FA] bg-[#F5F9FF] p-4">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0D4183]">
                    <MapPin className="h-4 w-4" />
                    Pontos de venda e retirada
                  </h3>
                  <ul className="mt-2.5 space-y-2 text-sm text-stone-700">
                    {campaign.saleLocations.map((saleLocation, index) => (
                      <li key={`${saleLocation.address}-${index}`} className="flex gap-2">
                        <span className="font-semibold text-[#0D4183]">{index + 1}.</span>
                        <span>{saleLocation.address} · {saleLocation.neighborhood}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Chave Pix se houver */}
              {campaign.pixKey && (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#E04F33]" />
                      Chave Pix da Entidade
                    </span>
                    {campaign.pixBeneficiary && (
                      <span className="text-stone-500 truncate max-w-[200px]">
                        {campaign.pixBeneficiary}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200">
                    <input
                      type="text"
                      readOnly
                      value={campaign.pixKey}
                      className="w-full bg-transparent text-xs font-mono text-stone-800 outline-hidden select-all"
                    />
                    <button
                      onClick={handleCopyPix}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        copiedPix
                          ? 'bg-stone-900 text-white'
                          : 'bg-[#FFF4F1] text-[#E04F33] hover:bg-[#FFEAE5] border border-[#FCDAD1]'
                      }`}
                    >
                      {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedPix ? 'Copiado!' : 'Copiar Pix'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de Ações: Fica SOMENTE no rodapé da coluna de detalhes (sem encostar na foto) */}
            <div className="p-4 sm:p-5 bg-white border-t border-stone-100 flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleShare}
                className="p-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors shrink-0 cursor-pointer"
                title="Compartilhar"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {campaign.pixKey && (
                <button
                  onClick={handleCopyPix}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                    copiedPix
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-900 border-stone-200'
                  }`}
                >
                  {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Pix'}</span>
                </button>
              )}

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#E04F33] hover:bg-[#C84228] text-white transition-colors shadow-xs cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Falar no WhatsApp</span>
                </a>
              )}

              {!whatsappHref && contacts.email && (
                <a
                  href={`mailto:${contacts.email}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#E04F33] hover:bg-[#C84228] text-white transition-colors shadow-xs cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar e-mail</span>
                </a>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
