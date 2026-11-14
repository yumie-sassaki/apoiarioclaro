'use client';

import React, { useState } from 'react';
import { VerificationRequest, OrganizationCategory } from '@/types';
import { X, CheckCircle } from 'lucide-react';
import { formatCnpj, formatPhoneBR, isValidCnpj, isValidEmail, isValidPhoneBR } from '@/lib/masks';

interface RegisterOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (request: Omit<VerificationRequest, 'id' | 'requestedAt' | 'status'>) => void;
}

export const RegisterOrgModal: React.FC<RegisterOrgModalProps> = ({
  isOpen,
  onClose,
  onSubmitRequest
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    orgName: '',
    category: 'lar_idosos' as OrganizationCategory,
    cnpj: '',
    responsibleName: '',
    responsibleRole: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    neighborhood: '',
    socialMediaOrWebsite: '',
    purpose: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cnpj.trim() && !isValidCnpj(formData.cnpj)) {
      setFormError('Informe um CNPJ válido com 14 dígitos ou deixe o campo em branco.');
      return;
    }
    if (formData.responsibleName.trim().split(/\s+/).filter(Boolean).length < 2) {
      setFormError('Informe nome e sobrenome do responsável.');
      return;
    }
    if (!isValidPhoneBR(formData.whatsapp)) {
      setFormError('Informe um WhatsApp válido com DDD, como (19) 99999-9999.');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setFormError('Informe um e-mail institucional válido.');
      return;
    }
    setFormError('');
    onSubmitRequest(formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in duration-200 flex flex-col">
        
        {/* Barrinha indicadora de arrasto no mobile */}
        <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header Flat */}
        <div className="p-5 sm:p-6 border-b border-stone-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Solicitação de Cadastro de Entidade</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Todas as instituições são verificadas pela equipe do Apoia Rio Claro antes de publicar campanhas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFF4F1] text-[#E04F33] flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Solicitação Enviada!</h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              Sua solicitação foi encaminhada para a <strong>equipe do Apoia Rio Claro</strong>. Entraremos em contato via WhatsApp com o responsável para validar as informações.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {formError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                {formError}
              </p>
            )}
            {/* Nome e Categoria */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nome Oficial da Instituição / Igreja / ONG *
              </label>
              <input
                type="text"
                required
                maxLength={120}
                placeholder="Ex: Paróquia Bom Jesus, Asilo São Vicente de Paulo"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Tipo de Entidade *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as OrganizationCategory })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden bg-white cursor-pointer"
                >
                  <option value="lar_idosos">Lar de Idosos</option>
                  <option value="orfanato">Orfanato / Acolhimento</option>
                  <option value="igreja">Igreja / Paróquia / Pastoral</option>
                  <option value="ong">ONG / Associação Beneficente</option>
                  <option value="assistencia_social">Assistência Social Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  CNPJ (se possuir)
                </label>
                <input
                  type="text"
                  maxLength={18}
                  inputMode="numeric"
                  placeholder="00.000.000/0001-00"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:border-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Responsável */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Dados do Responsável pelo Contato
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Seu nome"
                    value={formData.responsibleName}
                    onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:border-stone-900 focus:outline-hidden bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Cargo / Vínculo *</label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="Ex: Coordenador, Diretor, Pastor"
                    value={formData.responsibleRole}
                    onChange={(e) => setFormData({ ...formData, responsibleRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:border-stone-900 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">WhatsApp de Contato *</label>
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    inputMode="tel"
                    placeholder="(19) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: formatPhoneBR(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:border-stone-900 focus:outline-hidden bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">E-mail Institucional *</label>
                  <input
                    type="email"
                    required
                    placeholder="contato@entidade.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:border-stone-900 focus:outline-hidden bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Endereço em Rio Claro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Endereço em Rio Claro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rua / Av., número"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Santana, Centro, Cervezão"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Finalidade */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Tipos de ações que pretendem divulgar *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ex: Venda de adesões de almoço beneficente, arrecadação de alimentos da cesta básica..."
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-colors cursor-pointer"
              >
                Enviar Solicitação
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
