'use client';

import React from 'react';
import { VerificationRequest, Organization } from '@/types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  ExternalLink,
  Info
} from 'lucide-react';

interface AdminApprovalModalProps {
  requests: VerificationRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  verifiedOrganizations: Organization[];
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  requests,
  onApproveRequest,
  onRejectRequest,
  verifiedOrganizations
}) => {
  const pendingRequests = requests.filter((r) => r.status === 'pendente');

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Banner de Explicação da Governança (Flat, sem badge decorativo redundante) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              Painel do Curador (Verificação Prévia)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Para evitar fraudes e garantir a legitimidade das campanhas em Rio Claro, apenas organizações credenciadas por você conseguem publicar no mural público.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#FAF8F5] px-3.5 py-2 rounded-xl border border-stone-200 shrink-0">
            <span className="text-xs font-semibold text-stone-600">Fila:</span>
            <span className="px-2 py-0.5 rounded-md bg-stone-900 text-white font-bold text-xs">
              {pendingRequests.length} pendente(s)
            </span>
          </div>
        </div>

        {/* Dica de Segurança */}
        <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
          <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
          <p>
            <strong>Diretriz do Projeto:</strong> Antes de aprovar, confira os dados cadastrais e o contato informado para validar a autenticidade da instituição em Rio Claro.
          </p>
        </div>
      </div>

      {/* Solicitações Pendentes */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-stone-900">
          Solicitações Aguardando Aprovação ({pendingRequests.length})
        </h3>

        {pendingRequests.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-stone-400 mx-auto" />
            <h4 className="font-bold text-stone-800 text-sm">Nenhuma solicitação pendente</h4>
            <p className="text-xs text-stone-500">
              Todas as entidades solicitantes já foram analisadas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Dados da Solicitação */}
                  <div className="space-y-3.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        Pendente desde {req.requestedAt}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#FFF4F1] text-[#E04F33] border border-[#FCDAD1]">
                        {req.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-bold text-stone-900 leading-snug">{req.orgName}</h4>
                      {req.cnpj && (
                        <p className="text-xs text-stone-500 font-mono mt-0.5">
                          CNPJ: {req.cnpj}
                        </p>
                      )}
                    </div>

                    {/* Grade de Contato */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span><strong>Responsável:</strong> {req.responsibleName} ({req.responsibleRole})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span><strong>WhatsApp:</strong> {req.whatsapp}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{req.address} - {req.neighborhood}, Rio Claro</span>
                      </div>
                      {req.socialMediaOrWebsite && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate"><strong>Link:</strong> {req.socialMediaOrWebsite}</span>
                        </div>
                      )}
                    </div>

                    {/* Justificativa */}
                    <div>
                      <span className="text-xs font-bold text-stone-700 block mb-1">
                        Finalidade / Tipos de ações:
                      </span>
                      <p className="text-xs sm:text-sm text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
                        {req.purpose}
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação na Direita */}
                  <div className="flex md:flex-col justify-end gap-2.5 shrink-0 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
                    <button
                      onClick={() => onApproveRequest(req.id)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Aprovar Cadastro</span>
                    </button>

                    <button
                      onClick={() => onRejectRequest(req.id)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Recusar</span>
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Entidades Já Verificadas */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-stone-900">
          Entidades Credenciadas ({verifiedOrganizations.length})
        </h3>
        
        <div className="divide-y divide-stone-100">
          {verifiedOrganizations.map((org) => (
            <div key={org.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 font-bold flex items-center justify-center text-xs shrink-0">
                  {org.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-stone-900 text-sm block">{org.name}</span>
                  <span className="text-xs text-stone-500">
                    {org.neighborhood}, Rio Claro • {org.contactPerson}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                <CheckCircle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                Credenciada
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
