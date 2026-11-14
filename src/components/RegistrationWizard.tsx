'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, LoaderCircle, Mail, MapPin, Phone, Search, User } from 'lucide-react';
import { OrganizationCategory, VerificationRequest } from '@/types';
import { createVerificationRequestInDb } from '@/services/database';
import {
  formatCep,
  formatCnpj,
  formatPhoneBR,
  isMeaningfulText,
  isValidCnpj,
  isValidEmail,
  isValidPhoneBR
} from '@/lib/masks';

type Step = 1 | 2 | 3;
type CepResponse = { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean };

const categories: Array<{ value: OrganizationCategory | 'outro'; label: string }> = [
  { value: 'lar_idosos', label: 'Lar de idosos' },
  { value: 'orfanato', label: 'Acolhimento infantojuvenil' },
  { value: 'igreja', label: 'Igreja ou pastoral social' },
  { value: 'ong', label: 'ONG ou associação' },
  { value: 'assistencia_social', label: 'Assistência social' },
  { value: 'outro', label: 'Outro' }
];

export function RegistrationWizard({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [orgName, setOrgName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [category, setCategory] = useState<OrganizationCategory | 'outro'>('lar_idosos');
  const [customCategory, setCustomCategory] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Rio Claro');
  const [state, setState] = useState('SP');
  const [responsibleName, setResponsibleName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [cepMessage, setCepMessage] = useState('');
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');

  const lookupCep = async () => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepMessage('Digite os 8 números do CEP para buscar o endereço.');
      return;
    }
    setIsLookingUpCep(true);
    setCepMessage('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json() as CepResponse;
      if (!response.ok || data.erro) {
        setCepMessage('Não encontramos esse CEP. Preencha o endereço manualmente.');
        return;
      }
      setStreet(data.logradouro || '');
      setNeighborhood(data.bairro || '');
      setCity(data.localidade || '');
      setState(data.uf || '');
      setCepMessage('Endereço encontrado. Confira e complete o número.');
    } catch {
      setCepMessage('Não foi possível consultar o CEP agora. Você pode preencher manualmente.');
    } finally {
      setIsLookingUpCep(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!isMeaningfulText(orgName, 3, 1) || (category === 'outro' && !isMeaningfulText(customCategory, 3, 1))) {
        setStepError('Preencha um nome e tipo de causa válidos (mínimo de 3 caracteres).');
        return;
      }
      if (cnpj.trim() && !isValidCnpj(cnpj)) {
        setStepError('Informe um CNPJ válido com 14 dígitos ou deixe o campo em branco.');
        return;
      }
      setStepError('');
      setStep(2);
    } else if (step === 2) {
      if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim()) {
        setStepError('Confira o endereço e preencha os campos obrigatórios.');
        return;
      }
      setStepError('');
      setStep(3);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (responsibleName.trim().split(/\s+/).filter(Boolean).length < 2) {
      setStepError('Informe nome e sobrenome do responsável.');
      return;
    }
    if (!isValidEmail(email)) {
      setStepError('Informe um e-mail institucional válido.');
      return;
    }
    if (!isValidPhoneBR(whatsapp)) {
      setStepError('Informe um WhatsApp válido com DDD, como (19) 99999-9999.');
      return;
    }
    setStepError('');
    setIsSubmitting(true);
    const fullAddress = [street.trim(), number.trim(), complement.trim(), neighborhood.trim(), `${city.trim()} - ${state.trim()}`, cep.trim()].filter(Boolean).join(', ');
    const categoryNote = category === 'outro' ? `Tipo de causa informado: ${customCategory.trim()}.` : '';
    const request: VerificationRequest = {
      id: crypto.randomUUID(),
      orgName: orgName.trim(),
      category: category === 'outro' ? 'ong' : category,
      cnpj: cnpj.trim(),
      responsibleName: responsibleName.trim(),
      responsibleRole: 'Responsável institucional',
      phone: whatsapp.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      email: email.trim().toLowerCase(),
      address: fullAddress,
      neighborhood: neighborhood.trim(),
      socialMediaOrWebsite: '',
      purpose: [categoryNote, notes.trim()].filter(Boolean).join('\n\n') || 'Solicitação de credenciamento enviada pela organização.',
      status: 'pendente',
      requestedAt: new Date().toISOString()
    };
    try {
      await createVerificationRequestInDb(request);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitle = step === 1 ? 'Sobre a organização' : step === 2 ? 'Onde ela funciona?' : 'Contato e finalização';

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400">
          <span>Cadastro em 3 etapas</span><span>Etapa {step} de 3</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((item) => <span key={item} className={`h-1 rounded-full ${item <= step ? 'bg-[#0D4183]' : 'bg-stone-200'}`} />)}
        </div>
        <h3 className="pt-2 text-base font-bold text-stone-900">{stepTitle}</h3>
        {stepError && <p className="text-xs font-medium text-rose-700">{stepError}</p>}
      </div>

      {step === 1 && <div className="space-y-3">
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Nome da instituição *</span><span className="relative block"><Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={orgName} onChange={(e) => setOrgName(e.target.value)} maxLength={120} placeholder="Ex.: Lar São Vicente" className="h-11 w-full rounded-xl border border-stone-300 pl-9 pr-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></span></label>
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">CNPJ <span className="normal-case font-medium text-stone-400">(opcional)</span></span><input value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} maxLength={18} inputMode="numeric" placeholder="00.000.000/0001-00" className="h-11 w-full rounded-xl border border-stone-300 px-3 font-mono text-sm focus:border-stone-900 focus:outline-hidden" /></label>
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Tipo de causa *</span><select value={category} onChange={(e) => setCategory(e.target.value as OrganizationCategory | 'outro')} className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm focus:border-stone-900 focus:outline-hidden">{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        {category === 'outro' && <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Qual é o tipo de causa? *</span><input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} maxLength={60} placeholder="Ex.: Projeto ambiental" className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></label>}
      </div>}

      {step === 2 && <div className="space-y-3">
        <div className="space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">CEP *</span><div className="flex gap-2"><input value={cep} onChange={(e) => setCep(formatCep(e.target.value))} onBlur={lookupCep} maxLength={9} inputMode="numeric" placeholder="00000-000" className="h-11 min-w-0 flex-1 rounded-xl border border-stone-300 px-3 font-mono text-sm focus:border-stone-900 focus:outline-hidden" required /><button type="button" onClick={lookupCep} disabled={isLookingUpCep} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-stone-100 px-3 text-xs font-bold text-stone-700 hover:bg-stone-200 disabled:opacity-60">{isLookingUpCep ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Buscar</button></div>{cepMessage && <p className="text-xs text-stone-500">{cepMessage}</p>}</div>
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Rua / avenida *</span><input value={street} onChange={(e) => setStreet(e.target.value)} className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Número *</span><input value={number} onChange={(e) => setNumber(e.target.value)} className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></label><label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Complemento</span><input value={complement} onChange={(e) => setComplement(e.target.value)} className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-stone-900 focus:outline-hidden" /></label></div>
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Bairro *</span><span className="relative block"><MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="h-11 w-full rounded-xl border border-stone-300 pl-9 pr-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></span></label>
        <div className="grid grid-cols-[1fr_76px] gap-3"><label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Cidade *</span><input value={city} onChange={(e) => setCity(e.target.value)} className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></label><label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">UF *</span><input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm uppercase focus:border-stone-900 focus:outline-hidden" required /></label></div>
      </div>}

      {step === 3 && <div className="space-y-3">
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Nome do responsável *</span><span className="relative block"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} maxLength={100} className="h-11 w-full rounded-xl border border-stone-300 pl-9 pr-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></span></label>
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">E-mail do responsável *</span><span className="relative block"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-xl border border-stone-300 pl-9 pr-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></span></label>
        <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-900">Se a solicitação for aprovada, enviaremos para este e-mail um convite seguro para criar a senha de acesso.</p>
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">WhatsApp da organização *</span><span className="relative block"><Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(formatPhoneBR(e.target.value))} maxLength={15} inputMode="tel" placeholder="(19) 99999-9999" className="h-11 w-full rounded-xl border border-stone-300 pl-9 pr-3 text-sm focus:border-stone-900 focus:outline-hidden" required /></span></label>
        <label className="block space-y-1"><span className="text-xs font-bold uppercase tracking-wider text-stone-700">Conte um pouco sobre a organização <span className="normal-case font-medium text-stone-400">(opcional)</span></span><textarea rows={3} maxLength={600} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Público atendido, trabalho realizado ou uma breve apresentação da instituição." className="w-full resize-none rounded-xl border border-stone-300 p-3 text-sm focus:border-stone-900 focus:outline-hidden" /></label>
      </div>}

      <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
        {step > 1 ? <button type="button" onClick={() => setStep((step - 1) as Step)} className="inline-flex h-10 items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"><ArrowLeft className="h-4 w-4" />Voltar</button> : <span />}
        {step < 3 ? <button type="button" onClick={nextStep} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0D4183] px-4 text-xs font-bold text-white hover:bg-[#08356D]">Continuar<ArrowRight className="h-4 w-4" /></button> : <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#E04F33] px-4 text-xs font-bold text-white hover:bg-[#C84127] disabled:opacity-60">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{isSubmitting ? 'Enviando...' : 'Enviar solicitação'}</button>}
      </div>
    </form>
  );
}
