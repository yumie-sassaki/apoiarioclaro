'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CreditCard, ImagePlus, LoaderCircle, MapPin, Ticket, X } from 'lucide-react';
import { Campaign, CampaignCategory, Organization, PaymentMethod } from '@/types';
import { supabase } from '@/lib/supabase';
import { isMeaningfulText, isValidUrl } from '@/lib/masks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  onCreateCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  campaignToEdit?: Campaign | null;
  onUpdateCampaign?: (campaign: Campaign) => Promise<void>;
}

const labels: Record<CampaignCategory, string> = {
  adesao: 'Adesão / venda beneficente', evento: 'Evento / festa beneficente', alimentos: 'Doação de alimentos',
  cartinhas: 'Cartinhas / apadrinhamento', agasalho: 'Roupas e agasalhos',
  financeiro: 'Arrecadação financeira', voluntariado: 'Voluntariado'
};
const units: Record<CampaignCategory, string> = {
  adesao: 'itens / adesões', evento: 'participantes', alimentos: 'kg', cartinhas: 'cartinhas', agasalho: 'peças', financeiro: 'reais', voluntariado: 'voluntários'
};
const defaultImages: Record<CampaignCategory, string> = {
  alimentos: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80',
  agasalho: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80',
  adesao: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
  evento: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
  cartinhas: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80',
  financeiro: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=900&q=80',
  voluntariado: 'https://images.unsplash.com/photo-1559027615-0285ee1e5c37?auto=format&fit=crop&w=900&q=80'
};
const money = (value: string) => {
  const cents = value.replace(/\D/g, '');
  if (!cents) return '';
  return (Number(cents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const moneyNumber = (value: string) => Number(value.replace(/\D/g, '')) / 100;
const localToday = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};
const localMaxDate = () => {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + 2);
  const month = String(limit.getMonth() + 1).padStart(2, '0');
  const day = String(limit.getDate()).padStart(2, '0');
  return `${limit.getFullYear()}-${month}-${day}`;
};

export function NewCampaignModal({ isOpen, onClose, organization, onCreateCampaign, campaignToEdit, onUpdateCampaign }: Props) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('alimentos');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [location, setLocation] = useState('');
  const [goal, setGoal] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [details, setDetails] = useState('');
  const [imageUrl, setImageUrl] = useState(defaultImages.alimentos);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setTitle(campaignToEdit?.title || '');
    setCategory(campaignToEdit?.category || 'alimentos');
    setStartDate(campaignToEdit?.startDate || '');
    setDeadline(campaignToEdit?.deadlineDate || '');
    setLocation(campaignToEdit?.location || '');
    setGoal(campaignToEdit?.targetGoal ? String(campaignToEdit.targetGoal.target * (campaignToEdit.category === 'financeiro' ? 100 : 1)) : '');
    setTicketPrice(campaignToEdit?.ticketPrice ? String(campaignToEdit.ticketPrice * 100) : '');
    setPriceOnRequest(campaignToEdit ? (campaignToEdit.category === 'adesao' && (!campaignToEdit.ticketPrice || campaignToEdit.ticketPrice <= 0)) : false);
    setDetails(campaignToEdit?.description || '');
    setImageUrl(campaignToEdit?.imageUrl || defaultImages.alimentos);
    setPaymentMethod(campaignToEdit?.paymentMethod || (organization.pixKey ? 'pix' : 'presencial'));
    setPaymentUrl(campaignToEdit?.paymentUrl || '');
    setError('');
    setImageError('');
    setIsPublishing(false);
  }, [isOpen, campaignToEdit]);

  if (!isOpen) return null;

  const field = 'h-11 w-full rounded-xl border border-stone-300 px-3 text-sm focus:border-stone-900 focus:outline-hidden';
  const stepNames = ['Essencial', 'Como ajudar', 'Detalhes', 'Revisar'];
  const isFinancial = category === 'financeiro';
  const amount = isFinancial ? moneyNumber(goal) : Number(goal);
  const today = localToday();
  const maxDate = localMaxDate();
  const defaultLocation =
    organization.neighborhood &&
    !organization.address.toLowerCase().includes(organization.neighborhood.toLowerCase())
      ? `${organization.address} — ${organization.neighborhood}`
      : organization.address;
  const resolvedLocation = location.trim() || defaultLocation;

  const continueWizard = () => {
    let message = '';
    if (step === 1) {
      if (!isMeaningfulText(title, 8, 2)) {
        message = 'Informe um título claro com pelo menos 2 palavras (mínimo de 8 caracteres).';
      } else if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        message = 'Informe uma data limite válida.';
      } else if (deadline < today) {
        message = 'A data da campanha não pode ser anterior a hoje.';
      } else if (deadline > maxDate) {
        message = 'Informe uma data limite válida dentro dos próximos 2 anos.';
      } else if (startDate && (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate > deadline)) {
        message = 'A data de início não pode ser posterior à data limite.';
      }
    } else if (step === 2) {
      if (isFinancial) {
        if (!goal || amount < 1) {
          message = 'Informe uma meta de arrecadação válida.';
        } else if (paymentMethod === 'pix' && !organization.pixKey) {
          message = 'Cadastre a chave Pix da instituição no perfil para usar esta opção.';
        } else if (paymentMethod === 'url' && !isValidUrl(paymentUrl)) {
          message = 'Informe um link válido começando com https://.';
        }
      } else if (category === 'adesao' && !priceOnRequest && moneyNumber(ticketPrice) < 1) {
        message = 'Informe um valor válido ou marque a opção "Deixar valor sob consulta".';
      }
    } else if (step === 3) {
      if (!isMeaningfulText(details, 20, 4)) {
        message = 'Descreva os detalhes da campanha com pelo menos 20 caracteres para orientar quem vai ajudar.';
      }
    }
    if (message) return setError(message);
    setError('');
    setStep((current) => Math.min(4, current + 1));
  };

  const uploadImage = async (file: File) => {
    setImageError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return setImageError('Envie JPG, PNG ou WebP de até 5 MB.');
    const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
    if (!data.session?.access_token) return setImageError('Sua sessão expirou. Entre novamente para enviar uma foto.');
    const body = new FormData(); body.append('file', file);
    const response = await fetch('/api/campaign-images', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` }, body });
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) return setImageError(result.error || 'Não foi possível enviar a foto.');
    setImageUrl(result.url);
  };

  const publish = async () => {
    if (!isMeaningfulText(details, 20, 4)) {
      return setError('Descreva os detalhes da campanha com pelo menos 20 caracteres para orientar quem vai ajudar.');
    }
    setError(''); setIsPublishing(true);
    try {
      const data: Omit<Campaign, 'id' | 'createdAt' | 'status'> = {
        organizationId: organization.id, organizationName: organization.name, organizationVerified: organization.verified,
        title: title.trim(), description: details.trim(), category, categoryLabel: labels[category], urgency: 'normal',
        startDate: startDate || undefined,
        deadlineDate: deadline, location: resolvedLocation,
        neighborhood: organization.neighborhood,
        pixKey: isFinancial && paymentMethod === 'pix' ? organization.pixKey : undefined,
        pixBeneficiary: isFinancial && paymentMethod === 'pix' ? organization.name : undefined,
        paymentMethod: isFinancial ? paymentMethod : undefined,
        paymentUrl: isFinancial && paymentMethod === 'url' ? paymentUrl.trim() : undefined,
        ticketPrice: category === 'adesao' && !priceOnRequest && ticketPrice ? moneyNumber(ticketPrice) : undefined,
        targetGoal: goal ? { current: 0, target: amount, unit: isFinancial ? 'reais' : units[category] } : undefined,
        imageUrl
      };
      if (campaignToEdit && onUpdateCampaign) await onUpdateCampaign({ ...campaignToEdit, ...data });
      else await onCreateCampaign(data);
      onClose();
    } catch { setError('Não foi possível publicar a campanha. Tente novamente.'); }
    finally { setIsPublishing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-stone-950/60 backdrop-blur-xs sm:items-center sm:justify-center sm:p-4">
      <section className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl">
        <div className="mx-auto my-2 h-1 w-10 rounded-full bg-stone-300 sm:hidden" />
        <header className="flex items-start justify-between border-b border-stone-200 px-5 py-4 sm:px-6 sm:py-5">
          <div><h2 className="text-lg font-bold text-stone-900">{campaignToEdit ? 'Editar campanha' : 'Nova campanha'}</h2><p className="mt-0.5 text-xs text-stone-500">{organization.name}</p></div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100"><X className="h-5 w-5" /></button>
        </header>
        <div className="border-b border-stone-100 px-5 py-3 sm:px-6">
          <div className="grid grid-cols-4">{stepNames.map((name, index) => <div key={name} className="flex items-center justify-center gap-1.5"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-center text-[11px] font-bold leading-none ${step > index + 1 ? 'bg-emerald-600 text-white' : step === index + 1 ? 'bg-[#0D4183] text-white' : 'bg-stone-100 text-stone-500'}`}>{step > index + 1 ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className="hidden truncate text-[11px] font-semibold text-stone-600 sm:inline">{name}</span></div>)}</div>
        </div>
        <main className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
          {step === 1 && <div className="space-y-4">
            <div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">Título curto *</label><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Ex.: Pizza solidária da APAE" className={field} /><p className="mt-1 text-xs text-stone-500">Use pelo menos 2 palavras (ex.: Almoço Solidário da APAE).</p></div>
            <div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">Tipo de ação *</label><select value={category} onChange={(e) => { const selected = e.target.value as CampaignCategory; setCategory(selected); setImageUrl(defaultImages[selected]); setGoal(''); setTicketPrice(''); setPriceOnRequest(false); }} className={`${field} bg-white`}><option value="adesao">Adesão / venda beneficente</option><option value="evento">Evento / festa beneficente</option><option value="alimentos">Doação de alimentos</option><option value="agasalho">Roupas e agasalhos</option><option value="cartinhas">Cartinhas / apadrinhamento</option><option value="financeiro">Arrecadação financeira</option><option value="voluntariado">Voluntariado</option></select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">Data de início (opcional)</label>
                <input type="date" max={deadline || maxDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
                <p className="mt-1 text-xs text-stone-500">Deixe em branco se já começou.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">Data limite ou dia da ação *</label>
                <input type="date" min={startDate && startDate > today ? startDate : today} max={maxDate} value={deadline} onChange={(e) => setDeadline(e.target.value)} className={field} />
                <p className="mt-1 text-xs text-stone-500">Data final ou dia do evento (até 2 anos).</p>
              </div>
            </div>
          </div>}
          {step === 2 && <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-bold text-[#0D4183]">{labels[category]}</p><p className="mt-1 text-xs text-stone-600">Preencha só o necessário para que alguém consiga ajudar.</p></div>
            {isFinancial ? <><div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">Meta de arrecadação *</label><input inputMode="numeric" value={money(goal)} onChange={(e) => setGoal(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="R$ 0,00" className={field} /><p className="mt-1 text-xs text-stone-500">O valor é formatado automaticamente enquanto você digita.</p></div><fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-700">Como a pessoa pode doar? *</legend><div className="grid gap-2 sm:grid-cols-3">{([{ id: 'pix', name: 'Pix', text: organization.pixKey ? 'Chave institucional' : 'Cadastre o Pix no perfil' }, { id: 'url', name: 'Link externo', text: 'Vaquinha ou site' }, { id: 'presencial', name: 'Presencial', text: 'Na organização' }] as const).map((option) => { const unavailable = option.id === 'pix' && !organization.pixKey; return <label key={option.id} className={`rounded-xl border p-3 text-left ${unavailable ? 'cursor-not-allowed border-stone-100 bg-stone-50 opacity-60' : 'cursor-pointer'} ${paymentMethod === option.id ? 'border-[#0D4183] bg-blue-50' : 'border-stone-200'}`}><input className="sr-only" type="radio" checked={paymentMethod === option.id} disabled={unavailable} onChange={() => setPaymentMethod(option.id)} /><span className="block text-sm font-bold text-stone-800">{option.name}</span><span className="mt-0.5 block text-[11px] text-stone-500">{option.text}</span></label>; })}</div></fieldset>{paymentMethod === 'pix' && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-xs font-bold uppercase tracking-wider text-[#0D4183]">Chave Pix cadastrada da organização</p><p className="mt-1 break-all text-sm font-semibold text-stone-800">{organization.pixKey}</p><p className="mt-1 text-xs text-stone-600">Para alterar essa chave, atualize os dados da organização no Perfil.</p></div>}{paymentMethod === 'url' && <div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">Link para doação *</label><input type="url" value={paymentUrl} onChange={(e) => setPaymentUrl(e.target.value)} placeholder="https://..." className={field} /><p className="mt-1 text-xs text-stone-500">Pode ser a URL de uma vaquinha ou de outra plataforma segura.</p></div>}{paymentMethod === 'presencial' && <div><label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-700"><MapPin className="h-3.5 w-3.5" /> Onde doar presencialmente</label><input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={160} placeholder={`Padrão: ${organization.address}`} className={field} /></div>}</> : <><div><label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-700"><MapPin className="h-3.5 w-3.5" /> Local de entrega ou participação</label><input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={160} placeholder={`Padrão: ${organization.address}`} className={field} /></div>{category === 'adesao' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-stone-700">
                    <Ticket className="h-3.5 w-3.5" /> Valor da adesão ou item *
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#0D4183]">
                    <input
                      type="checkbox"
                      checked={priceOnRequest}
                      onChange={(e) => {
                        setPriceOnRequest(e.target.checked);
                        if (e.target.checked) setTicketPrice('');
                      }}
                      className="h-4 w-4 rounded border-stone-300 accent-[#0D4183]"
                    />
                    Deixar valor sob consulta
                  </label>
                </div>
                {priceOnRequest ? (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-stone-600">
                    O mural exibirá <strong className="text-stone-800">Sob consulta</strong> para que os interessados consultem valores e opções diretamente com a instituição.
                  </div>
                ) : (
                  <>
                    <input
                      inputMode="numeric"
                      value={money(ticketPrice)}
                      onChange={(e) => setTicketPrice(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="R$ 0,00"
                      className={field}
                    />
                    <p className="mt-1 text-xs text-stone-500">O valor é formatado automaticamente enquanto você digita.</p>
                  </>
                )}
              </div>
            )}<div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">Meta (opcional)</label><input inputMode="numeric" maxLength={6} value={goal} onChange={(e) => setGoal(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={`Ex.: 200 ${units[category]}`} className={field} /></div></>}
          </div>}
          {step === 3 && <div className="space-y-5"><div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-700">Detalhes para quem vai ajudar *</label><textarea rows={6} maxLength={1200} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tipo de alimento, tamanhos, regras do evento, horários, como entregar ou participar..." className="w-full rounded-xl border border-stone-300 p-3 text-sm leading-relaxed focus:border-stone-900 focus:outline-hidden" /><p className="mt-1 text-xs text-stone-500">Descreva em pelo menos 20 caracteres — este texto aparecerá na campanha.</p></div><div className="space-y-3"><p className="text-xs font-bold uppercase tracking-wider text-stone-700">Imagem de capa</p><img src={imageUrl} alt="Prévia da capa" className="h-36 w-full rounded-2xl object-cover" /><label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#0D4183] text-sm font-bold text-[#0D4183] hover:bg-blue-50"><ImagePlus className="h-4 w-4" /> Enviar outra foto<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file); }} /></label>{imageError && <p className="text-xs text-rose-700">{imageError}</p>}<button type="button" onClick={() => setImageUrl(defaultImages[category])} className="text-xs font-semibold text-stone-600 underline">Usar imagem padrão</button></div></div>}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Confira antes de publicar</h3>
                <p className="mt-1 text-xs text-stone-500">A campanha será exibida no mural público.</p>
              </div>
              <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
                <img src={imageUrl} alt="Capa da campanha" className="h-36 w-full object-cover" />
                <div className="space-y-3 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#E04F33]">{labels[category]}</p>
                  <h4 className="text-base font-bold text-stone-900">{title || 'Título da campanha'}</h4>
                  <p className="line-clamp-3 text-xs leading-relaxed text-stone-600">{details || 'Os detalhes da campanha aparecerão aqui.'}</p>

                  <div className="rounded-xl border border-stone-200/80 bg-[#FAF8F5] p-3 space-y-2 text-xs">
                    {category === 'adesao' && (priceOnRequest || ticketPrice) && (
                      <div className="flex items-start gap-2">
                        <Ticket className="h-3.5 w-3.5 text-[#E04F33] shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Valor da adesão / item</span>
                          <span className="font-bold text-stone-900">{priceOnRequest ? 'Sob consulta' : money(ticketPrice)}</span>
                        </div>
                      </div>
                    )}
                    {isFinancial && goal && (
                      <div className="flex items-start gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-[#0D4183] shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Meta de arrecadação</span>
                          <span className="font-bold text-stone-900">{money(goal)}</span>
                        </div>
                      </div>
                    )}
                    {resolvedLocation && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#E04F33] shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Local / Endereço</span>
                          <span className="font-medium text-stone-800">{resolvedLocation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </div>
          )}
        </main>
        <footer className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-5 py-4 sm:px-6"><button type="button" onClick={() => step === 1 ? onClose() : setStep((current) => current - 1)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-stone-600 hover:bg-stone-100"><ArrowLeft className="h-4 w-4" /> {step === 1 ? 'Cancelar' : 'Voltar'}</button>{step < 4 ? <button type="button" onClick={continueWizard} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0D4183] px-4 text-sm font-bold text-white hover:bg-[#09356d]">Continuar <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={() => void publish()} disabled={isPublishing} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#E04F33] px-4 text-sm font-bold text-white hover:bg-[#C84127] disabled:opacity-60">{isPublishing && <LoaderCircle className="h-4 w-4 animate-spin" />}{isPublishing ? 'Salvando...' : campaignToEdit ? 'Salvar alterações' : 'Publicar campanha'}</button>}</footer>
      </section>
    </div>
  );
}
