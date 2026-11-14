'use client';

import { ChangeEvent, FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, ImagePlus, ReceiptText } from 'lucide-react';
import { Campaign, CampaignCategory, User } from '@/types';
import { concludeCampaignWithReport, fetchCampaigns, fetchUserById } from '@/services/database';
import { HelpSupportButton } from '@/components/HelpSupportButton';
import { supabase } from '@/lib/supabase';

type GoalStatus = 'atingida' | 'superada' | 'parcial';

interface CategoryQuestions {
  totalQuestion: string;
  totalPlaceholder: string;
  beneficiariesQuestion: string;
  beneficiariesPlaceholder: string;
  summaryQuestion: string;
  summaryPlaceholder: string;
}

const categoryQuestions: Record<CampaignCategory, CategoryQuestions> = {
  adesao: {
    totalQuestion: '1. Quantas adesões foram vendidas ou qual foi o valor total arrecadado?',
    totalPlaceholder: 'Ex.: 180 adesões vendidas (R$ 8.100,00 arrecadados)',
    beneficiariesQuestion: '2. Quem será beneficiado com o resultado deste evento?',
    beneficiariesPlaceholder: 'Ex.: 65 idosos acolhidos pela instituição',
    summaryQuestion: '3. Como foi o evento e onde o valor arrecadado será utilizado?',
    summaryPlaceholder:
      'Conte brevemente como foi a realização do evento e em que a instituição aplicará os recursos...'
  },
  alimentos: {
    totalQuestion: '1. Quantos quilos de alimentos ou cestas básicas foram arrecadados?',
    totalPlaceholder: 'Ex.: 420 kg de alimentos e 35 cestas básicas',
    beneficiariesQuestion: '2. Quantas famílias ou pessoas receberam os alimentos?',
    beneficiariesPlaceholder: 'Ex.: 68 famílias atendidas',
    summaryQuestion: '3. Como foi feita a entrega ou o uso dos alimentos arrecadados?',
    summaryPlaceholder:
      'Conte brevemente como os alimentos foram distribuídos às famílias ou utilizados nas refeições da entidade...'
  },
  agasalho: {
    totalQuestion: '1. Quantas peças de roupa, calçados ou cobertores foram arrecadados?',
    totalPlaceholder: 'Ex.: 310 agasalhos e 45 cobertores',
    beneficiariesQuestion: '2. Quantas pessoas ou famílias receberam as doações?',
    beneficiariesPlaceholder: 'Ex.: 120 moradores atendidos',
    summaryQuestion: '3. Como foi feita a triagem e a entrega das peças?',
    summaryPlaceholder:
      'Conte brevemente como as roupas e cobertores foram entregues para quem precisava...'
  },
  cartinhas: {
    totalQuestion: '1. Quantas cartinhas ou presentes foram apadrinhados e entregues?',
    totalPlaceholder: 'Ex.: 85 cartinhas atendidas',
    beneficiariesQuestion: '2. Quantas crianças ou acolhidos receberam os presentes?',
    beneficiariesPlaceholder: 'Ex.: 85 crianças atendidas pela instituição',
    summaryQuestion: '3. Como foi o momento da entrega dos presentes?',
    summaryPlaceholder: 'Conte brevemente como foi a entrega e a reação dos atendidos...'
  },
  financeiro: {
    totalQuestion: '1. Qual foi o valor total arrecadado na campanha?',
    totalPlaceholder: 'Ex.: R$ 8.500,00',
    beneficiariesQuestion: '2. Quantas pessoas ou qual área da instituição foi beneficiada?',
    beneficiariesPlaceholder: 'Ex.: Ala de atendimento com 40 pessoas por semana',
    summaryQuestion: '3. O que foi comprado, pago ou realizado com o valor arrecadado?',
    summaryPlaceholder:
      'Detalhe onde os recursos foram aplicados (ex.: compra de equipamentos, obras, insumos)...'
  },
  voluntariado: {
    totalQuestion: '1. Quantos voluntários participaram da ação?',
    totalPlaceholder: 'Ex.: 24 voluntários em 2 dias de ação',
    beneficiariesQuestion: '2. Quantos atendidos ou qual espaço da instituição foi beneficiado?',
    beneficiariesPlaceholder: 'Ex.: Refeitório e área de convivência da unidade',
    summaryQuestion: '3. Quais atividades foram realizadas pelos voluntários?',
    summaryPlaceholder:
      'Conte o que foi feito durante a ação voluntária e a melhoria gerada para a instituição...'
  }
};

const goalStatusOptions: Array<{ value: GoalStatus; label: string }> = [
  { value: 'atingida', label: 'Sim, atingimos a meta' },
  { value: 'superada', label: 'Superamos a meta' },
  { value: 'parcial', label: 'Atingimos parcialmente' }
];

async function uploadFiles(files: FileList, endpoint: string): Promise<string[]> {
  if (!supabase) throw new Error('Autenticação indisponível.');
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error('Sua sessão expirou.');
  return Promise.all(
    Array.from(files).map(async (file) => {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session?.access_token}` },
        body
      });
      const result = (await response.json()) as { url?: string; path?: string; error?: string };
      const uploaded = result.url || result.path;
      if (!response.ok || !uploaded) throw new Error(result.error || 'Não foi possível enviar o arquivo.');
      return uploaded;
    })
  );
}

function PrestacaoContasContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [goalStatus, setGoalStatus] = useState<GoalStatus | ''>('');
  const [total, setTotal] = useState('');
  const [summary, setSummary] = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [thanks, setThanks] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [receipts, setReceipts] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!supabase) return router.replace('/login');
      const { data } = await supabase.auth.getUser();
      const user: User | null = data.user ? await fetchUserById(data.user.id) : null;
      const item = (await fetchCampaigns()).find((entry) => entry.id === id) || null;
      if (!user || !item || user.organizationId !== item.organizationId) return router.replace('/painel');
      setCampaign(item);
      setGoalStatus(item.resultReport?.goalStatus || '');
      setTotal(item.resultReport?.totalCollected || '');
      setSummary(item.resultReport?.achievedSummary || '');
      setBeneficiaries(item.resultReport?.beneficiaries || '');
      setThanks(item.resultReport?.testimonial || '');
      setPhotos(item.resultReport?.photoUrls || (item.resultReport?.photoUrl ? [item.resultReport.photoUrl] : []));
      setReceipts(item.resultReport?.receiptUrls || []);
    };
    void load();
  }, [id, router]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, type: 'photos' | 'receipts') => {
    const files = event.target.files;
    if (!files?.length) return;
    setError('');
    setIsUploading(true);
    try {
      const urls = await uploadFiles(files, type === 'photos' ? '/api/campaign-images' : '/api/campaign-documents');
      if (type === 'photos') {
        setPhotos((old) => [...old, ...urls]);
      } else {
        setReceipts((old) => [...old, ...urls]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha no envio.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!campaign) return;
    if (!total.trim() || !summary.trim()) {
      return setError('Responda quanto foi alcançado e como o resultado foi aplicado.');
    }
    setError('');
    setIsSaving(true);
    try {
      await concludeCampaignWithReport(campaign.id, {
        completedAt: new Date().toISOString().split('T')[0],
        goalStatus: goalStatus || undefined,
        totalCollected: total.trim(),
        achievedSummary: summary.trim(),
        photoUrl: photos[0] || campaign.imageUrl,
        photoUrls: photos,
        receiptUrls: receipts,
        beneficiaries: beneficiaries.trim() || undefined,
        challenges: campaign.resultReport?.challenges,
        testimonial: thanks.trim() || undefined
      });
      router.replace('/painel');
    } catch {
      setError('Não foi possível concluir a campanha. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!campaign) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] grid place-items-center text-sm text-stone-600">
        Carregando campanha…
      </main>
    );
  }

  const questions = categoryQuestions[campaign.category] || categoryQuestions.financeiro;
  const formattedTarget = campaign.targetGoal
    ? campaign.targetGoal.unit === 'reais'
      ? campaign.targetGoal.target.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : `${campaign.targetGoal.target} ${campaign.targetGoal.unit}`
    : null;

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-6 sm:py-10 text-stone-900">
      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/painel"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para campanhas
          </Link>

          <HelpSupportButton />
        </div>

        {/* Cabeçalho da Campanha */}
        <header className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-7 shadow-xs">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24 border border-stone-200/60"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E04F33]">
                  {campaign.status === 'concluida' ? 'Editar prestação de contas' : 'Encerrar campanha'}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs font-semibold text-stone-500">{campaign.categoryLabel}</span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-stone-900 font-display leading-tight">
                {campaign.title}
              </h1>
              <p className="mt-1.5 text-sm text-stone-500">
                Responda às perguntas abaixo para registrar os resultados desta ação no mural.
              </p>
            </div>
          </div>
        </header>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
            {error}
          </p>
        )}

        {/* Bloco 1: Perguntas Guiadas e Personalizadas */}
        <section className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-7 shadow-xs space-y-6">
          {/* Pergunta da Meta */}
          <div className="p-4 rounded-xl bg-[#FFF8F5] border border-[#F3DFD8] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-stone-900">
                A meta da campanha foi atingida?
              </span>
              {formattedTarget && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700">
                  Meta definida: {formattedTarget}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {goalStatusOptions.map((option) => {
                const isSelected = goalStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGoalStatus(isSelected ? '' : option.value)}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-left sm:text-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#E04F33] bg-[#E04F33] text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Perguntas 1 e 2 */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                {questions.totalQuestion} *
              </label>
              <input
                required
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder={questions.totalPlaceholder}
                className="w-full h-11 rounded-xl border border-stone-300 px-3.5 text-sm bg-white focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                {questions.beneficiariesQuestion}
              </label>
              <input
                value={beneficiaries}
                onChange={(e) => setBeneficiaries(e.target.value)}
                placeholder={questions.beneficiariesPlaceholder}
                className="w-full h-11 rounded-xl border border-stone-300 px-3.5 text-sm bg-white focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                {questions.summaryQuestion} *
              </label>
              <textarea
                required
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={questions.summaryPlaceholder}
                className="w-full rounded-xl border border-stone-300 p-3.5 text-sm leading-relaxed bg-white focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                4. Quer deixar uma mensagem de agradecimento para quem ajudou? (opcional)
              </label>
              <textarea
                rows={3}
                value={thanks}
                onChange={(e) => setThanks(e.target.value)}
                placeholder="Agradeça às pessoas e parceiros que contribuíram com a ação..."
                className="w-full rounded-xl border border-stone-300 p-3.5 text-sm leading-relaxed bg-white focus:border-stone-900 focus:outline-hidden"
              />
            </div>
          </div>
        </section>

        {/* Bloco 2: Galeria de Fotos */}
        <section className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-7 shadow-xs space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
              Fotos da ação realizada
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Mostre a entrega, o evento ou o resultado alcançado para os moradores de Rio Claro.
            </p>
          </div>

          <label className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-sm font-semibold text-stone-700 hover:bg-stone-100 transition-colors">
            <ImagePlus className="w-5 h-5 text-stone-500" />
            <span>{isUploading ? 'Enviando arquivos…' : 'Adicionar fotos'}</span>
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => void handleUpload(e, 'photos')}
            />
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="Comprovação da campanha"
                  className="h-28 w-full rounded-xl object-cover border border-stone-200"
                />
              ))}
            </div>
          )}
        </section>

        {/* Bloco 3: Comprovantes */}
        <section className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-7 shadow-xs space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
              Comprovantes e notas fiscais (opcional)
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Envie notas, recibos ou documentos relevantes. Eles ficarão disponíveis ao público na página de resultados para garantir transparência.
            </p>
          </div>

          <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors">
            <ReceiptText className="w-5 h-5 text-stone-500" />
            <span>Adicionar comprovantes</span>
            <input
              className="sr-only"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              onChange={(e) => void handleUpload(e, 'receipts')}
            />
          </label>

          {receipts.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {receipts.map((path, index) => (
                <span
                  key={path}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-xs font-semibold text-stone-700"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  Comprovante {index + 1} anexado
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Botão Principal */}
        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="w-full py-3.5 px-6 rounded-xl bg-[#E04F33] hover:bg-[#C84127] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
        >
          {isSaving
            ? 'Salvando…'
            : campaign.status === 'concluida'
              ? 'Salvar alterações na prestação'
              : 'Concluir campanha e publicar resultados'}
        </button>
      </form>
    </main>
  );
}

export default function PrestacaoContasPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF8F5] grid place-items-center text-sm text-stone-600">
          Carregando campanha…
        </main>
      }
    >
      <PrestacaoContasContent />
    </Suspense>
  );
}
