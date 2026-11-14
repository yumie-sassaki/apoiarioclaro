'use client';

import React from 'react';
import { Organization } from '@/types';
import { MapPin, Calendar, Phone, Mail, Globe, ExternalLink } from 'lucide-react';
import { parseOrganizationContacts, buildWhatsAppUrl } from '@/lib/masks';

interface OrganizationCardProps {
  organization: Organization;
  activeCampaignsCount: number;
  onFilterByOrg: (orgId: string) => void;
}

function formatOrganizationAddress(address?: string, neighborhood?: string): string {
  const cleanAddress = (address || '').trim();
  const cleanNeighborhood = (neighborhood || '').trim();
  if (!cleanAddress) {
    return cleanNeighborhood ? `${cleanNeighborhood}, Rio Claro` : 'Rio Claro - SP';
  }
  const lower = cleanAddress.toLowerCase();
  const parts = [cleanAddress];
  if (cleanNeighborhood && !lower.includes(cleanNeighborhood.toLowerCase())) {
    parts.push(cleanNeighborhood);
  }
  if (!lower.includes('rio claro')) {
    parts.push('Rio Claro');
  }
  return parts.join(', ');
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  activeCampaignsCount,
  onFilterByOrg
}) => {
  const displayDescription =
    organization.description &&
    organization.description.trim() !== 'Solicitação de credenciamento enviada pela organização.'
      ? organization.description
      : '';
  const formattedAddress = formatOrganizationAddress(organization.address, organization.neighborhood);
  const contacts = parseOrganizationContacts(organization);
  const whatsappHref = contacts.whatsapp
    ? buildWhatsAppUrl(
        contacts.whatsapp,
        `Olá! Vi a instituição ${organization.name} no Apoia Rio Claro e gostaria de entrar em contato.`
      )
    : '';

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:border-stone-300 transition-all p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#FFF4F1] text-[#E04F33] flex items-center justify-center font-bold text-base shrink-0 border border-[#FCDAD1]">
              {organization.logoUrl ? (
                <img src={organization.logoUrl} alt={organization.name} className="w-full h-full object-cover" />
              ) : (
                organization.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base leading-snug">
                {organization.name}
              </h3>
              <span className="inline-block mt-0.5 text-xs font-medium text-stone-500">
                {organization.categoryLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Descrição */}
        {displayDescription && (
          <p className="mt-4 text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3">
            {displayDescription}
          </p>
        )}

        {/* Informações de Localização e Contato */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 space-y-1.5 text-xs text-stone-500">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{formattedAddress}</span>
          </div>
          {contacts.whatsapp && (
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-3.5 h-3.5 text-[#E04F33] shrink-0" />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-stone-700 hover:text-[#E04F33] hover:underline transition-colors truncate"
              >
                WhatsApp: {contacts.whatsapp}
              </a>
            </div>
          )}
          {contacts.phone && (
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <a href={`tel:${contacts.phone}`} className="hover:text-stone-800 transition-colors truncate">
                Telefone: {contacts.phone}
              </a>
            </div>
          )}
          {contacts.email && (
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <a
                href={`mailto:${contacts.email}`}
                className="hover:text-[#E04F33] hover:underline transition-colors truncate"
              >
                {contacts.email}
              </a>
            </div>
          )}
          {contacts.instagram && (
            <div className="flex items-center gap-2 min-w-0">
              <ExternalLink className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <a
                href={contacts.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#E04F33] hover:underline transition-colors truncate"
              >
                Instagram: {contacts.instagram}
              </a>
            </div>
          )}
          {contacts.website && (
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <a
                href={contacts.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#E04F33] hover:underline transition-colors truncate"
              >
                {contacts.website.replace(/^https?:\/\//i, '')}
              </a>
            </div>
          )}
          {organization.foundedYear && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>Atuando em Rio Claro desde {organization.foundedYear}</span>
            </div>
          )}
          {organization.cnpj && (
            <div className="text-[11px] text-stone-400 font-mono">
              CNPJ: {organization.cnpj}
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => onFilterByOrg(organization.id)}
          className="text-xs font-bold text-[#E04F33] hover:underline transition-colors cursor-pointer"
        >
          {activeCampaignsCount > 0 ? (
            <span>
              Ver {activeCampaignsCount} {activeCampaignsCount === 1 ? 'campanha ativa' : 'campanhas ativas'} →
            </span>
          ) : (
            <span className="text-stone-400 font-normal">Nenhuma campanha no momento</span>
          )}
        </button>

        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#E04F33] bg-[#FFF4F1] hover:bg-[#FFEAE5] border border-[#FCDAD1] transition-colors"
          >
            <Phone className="w-3 h-3" />
            <span>WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
};
