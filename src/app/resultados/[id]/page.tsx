'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  MapPin,
  Quote,
  X,
  ZoomIn,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Campaign, Organization } from '@/types';
import { fetchCampaigns, fetchOrganizations } from '@/services/database';
import { getStoredHeartedCampaigns, toggleStoredHeartedCampaign } from '@/lib/storage';

function resolveReceiptUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const normalizedPath = value.replace(/^\/+/, '');
  return baseUrl ? `${baseUrl}/storage/v1/object/public/campaign-documents/${normalizedPath}` : value;
}

function formatCompletedDate(value?: string): string {
  if (!value) return '';
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
}

function formatCleanAddress(address?: string, neighborhood?: string): string {
  const cleanAddress = (address || '').trim();
  const cleanNeighborhood = (neighborhood || '').trim();
  if (!cleanAddress) return cleanNeighborhood;
  if (!cleanNeighborhood) return cleanAddress;
  if (cleanAddress.toLowerCase().includes(cleanNeighborhood.toLowerCase())) {
    return cleanAddress;
  }
  return `${cleanAddress}, ${cleanNeighborhood}`;
}

function ResultadoDetalheContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [hearted, setHearted] = useState(false);

  useEffect(() => {
    setHearted(getStoredHeartedCampaigns().includes(id));
    let active = true;
    void Promise.all([fetchCampaigns(), fetchOrganizations()])
      .then(([campaigns, organizations]) => {
        if (!active) return;
        const item = campaigns.find((entry) => entry.id === id && entry.status === 'concluida') || null;
        setCampaign(item);
        setOrganization(item ? organizations.find((org) => org.id === item.organizationId) || null : null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const photos = useMemo(
    () =>
      campaign
        ? [...(campaign.resultReport?.photoUrls || []), ...(campaign.resultReport?.photoUrl ? [campaign.resultReport.photoUrl] : [])].filter(
            (item, index, all) => Boolean(item) && all.indexOf(item) === index
          )
        : [],
    [campaign]
  );

  useEffect(() => {
    if (photoIndex >= photos.length && photos.length > 0) {
      setPhotoIndex(0);
    }
  }, [photoIndex, photos.length]);

  useEffect(() => {
    if (photos.length <= 1 || isPaused || lightbox) return;
    const timer = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [photos.length, isPaused, lightbox]);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightbox(false);
      } else if (event.key === 'ArrowLeft' && photos.length > 1) {
        setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
      } else if (event.key === 'ArrowRight' && photos.length > 1) {
        setPhotoIndex((prev) => (prev + 1) % photos.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightbox, photos.length]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] grid place-items-center px-4 text-sm font-medium text-stone-600">
        Carregando resultado…
      </main>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <Header
          activeTab="resultados"
          setActiveTab={() => router.push('/')}
          loggedInOrg={null}
          onOpenNewCampaign={() => undefined}
        />
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-stone-900 font-display">Resultado não encontrado</h1>
            <p className="mt-2 text-sm text-stone-600">
              Esta campanha pode não existir ou ainda não foi encerrada com prestação de contas.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#E04F33] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#c84329]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para resultados
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const report = campaign.resultReport;
  const institutionName = organization?.name || campaign.organizationName;
  const completedDate = formatCompletedDate(report?.completedAt);
  const fullAddress = organization
    ? formatCleanAddress(organization.address, organization.neighborhood)
    : formatCleanAddress(campaign.location, campaign.neighborhood);

  const goalStatusBadge =
    report?.goalStatus === 'atingida'
      ? { label: 'Meta atingida', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
      : report?.goalStatus === 'superada'
        ? { label: 'Meta superada', className: 'bg-[#FFF8F5] text-[#E04F33] border border-[#F3DFD8]' }
        : report?.goalStatus === 'parcial'
          ? { label: 'Meta parcialmente atingida', className: 'bg-amber-50 text-amber-800 border border-amber-200' }
          : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header
        activeTab="resultados"
        setActiveTab={() => router.push('/')}
        loggedInOrg={null}
        onOpenNewCampaign={() => undefined}
      />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-7 sm:px-6 sm:py-10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-xs transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para resultados
          </Link>
        </div>

        <article className="space-y-6">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Campanha finalizada!
                </span>
                {campaign.categoryLabel && (
                  <span className="inline-flex items-center rounded-full border border-[#F3DFD8] bg-[#FFF8F5] px-3 py-1 text-xs font-bold text-[#E04F33]">
                    {campaign.categoryLabel}
                  </span>
                )}
                {completedDate && <span className="text-xs font-medium text-stone-500">Finalizada em {completedDate}</span>}
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = toggleStoredHeartedCampaign(campaign.id);
                  setHearted(next.includes(campaign.id));
                }}
                aria-pressed={hearted}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  hearted
                    ? 'border-[#F3DFD8] bg-[#FFF8F5] text-[#E04F33]'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${hearted ? 'fill-[#E04F33] text-[#E04F33]' : 'text-stone-400'}`} />
                <span>{hearted ? 'Amei' : 'Dar amei'}</span>
              </button>
            </div>

            <h1 className="mt-5 text-3xl font-bold leading-tight text-stone-900 font-display sm:text-4xl">
              {campaign.title}
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-stone-600">{campaign.description}</p>

            <div className="mt-6 flex items-center gap-3.5 rounded-2xl border border-stone-200 bg-[#FAF8F5] p-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#F3DFD8] bg-[#FFF8F5] text-sm font-bold text-[#E04F33]">
                {organization?.logoUrl ? (
                  <img src={organization.logoUrl} alt={institutionName} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Instituição responsável</p>
                <h2 className="mt-0.5 text-base font-bold text-stone-900 font-display">{institutionName}</h2>
                {fullAddress && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-stone-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E04F33]" />
                    <span>{fullAddress}</span>
                  </p>
                )}
              </div>
            </div>

            {report?.testimonial && (
              <blockquote className="mt-6 rounded-2xl border border-[#F3DFD8] bg-[#FFF8F5] p-5 text-stone-700">
                <div className="flex items-start gap-3">
                  <Quote className="mt-0.5 h-5 w-5 shrink-0 text-[#E04F33]" />
                  <p className="text-base italic leading-relaxed text-stone-700">{report.testimonial}</p>
                </div>
              </blockquote>
            )}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E04F33]">Resultado alcançado pela comunidade</p>
              {goalStatusBadge && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${goalStatusBadge.className}`}>
                  {goalStatusBadge.label}
                </span>
              )}
            </div>

            {report?.totalCollected && (
              <p className="mt-3 text-3xl font-bold text-stone-900 font-display">{report.totalCollected}</p>
            )}

            {report?.achievedSummary && (
              <p className="mt-4 text-base leading-relaxed text-stone-600">{report.achievedSummary}</p>
            )}

            {report?.beneficiaries && (
              <div className="mt-5 rounded-2xl border border-stone-200 bg-[#FAF8F5] px-4 py-3 text-sm text-stone-700">
                <strong className="font-semibold text-stone-900">Beneficiados:</strong> {report.beneficiaries}
              </div>
            )}

            {report?.challenges && (
              <div className="mt-3 rounded-2xl border border-stone-200 bg-[#FAF8F5] px-4 py-3 text-sm text-stone-700">
                <strong className="font-semibold text-stone-900">Desafios e próximos passos:</strong> {report.challenges}
              </div>
            )}
          </section>

          <section
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-6 py-4 sm:px-8 sm:py-5">
              <div>
                <h2 className="text-xl font-bold text-stone-900 font-display">Fotos da campanha</h2>
                <p className="mt-0.5 text-sm text-stone-500">Clique na imagem para ampliar em tela cheia.</p>
              </div>
              {photos.length > 0 && (
                <span className="rounded-full border border-stone-200 bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-stone-700">
                  {photoIndex + 1} de {photos.length}
                </span>
              )}
            </div>

            {photos.length > 0 ? (
              <>
                <div className="group relative overflow-hidden bg-stone-950">
                  <div
                    className="flex h-[320px] transition-transform duration-500 ease-out sm:h-[460px]"
                    style={{ transform: `translateX(-${photoIndex * 100}%)` }}
                  >
                    {photos.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative h-full w-full shrink-0 overflow-hidden bg-stone-950">
                        <img
                          src={url}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
                        />
                        <div className="absolute inset-0 bg-stone-950/30" />
                        <button
                          type="button"
                          onClick={() => setLightbox(true)}
                          className="relative z-10 flex h-full w-full cursor-zoom-in items-center justify-center p-3 sm:p-6"
                          aria-label={`Ampliar foto ${index + 1} de ${photos.length}`}
                        >
                          <img
                            src={url}
                            alt={`Registro ${index + 1} da campanha ${campaign.title}`}
                            className="h-full w-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-[1.01]"
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setLightbox(true)}
                    className="pointer-events-none absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-stone-950/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    Ampliar
                  </button>

                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)}
                        className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/90 text-stone-800 shadow-md backdrop-blur-xs transition-all hover:scale-105 hover:bg-white sm:left-4"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
                        className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/90 text-stone-800 shadow-md backdrop-blur-xs transition-all hover:scale-105 hover:bg-white sm:right-4"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="space-y-3 border-t border-stone-100 bg-white px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-center gap-1.5">
                      {photos.map((url, index) => (
                        <button
                          key={`dot-${url}-${index}`}
                          type="button"
                          onClick={() => setPhotoIndex(index)}
                          aria-label={`Ir para foto ${index + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === photoIndex ? 'w-6 bg-[#E04F33]' : 'w-2 bg-stone-300 hover:bg-stone-400'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                      {photos.map((url, index) => (
                        <button
                          key={`thumb-${url}-${index}`}
                          type="button"
                          onClick={() => setPhotoIndex(index)}
                          className={`h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                            index === photoIndex
                              ? 'border-[#E04F33] ring-2 ring-[#E04F33]/20'
                              : 'border-stone-200 opacity-70 hover:opacity-100'
                          }`}
                          aria-label={`Selecionar foto ${index + 1}`}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="grid h-56 place-items-center bg-[#FAF8F5] text-sm text-stone-500">
                Nenhuma foto publicada nesta prestação de contas.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#F3DFD8] bg-[#FFF8F5] text-[#E04F33]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 font-display">Comprovantes</h2>
                <p className="text-sm text-stone-500">Notas fiscais, recibos e documentos publicados pela instituição.</p>
              </div>
            </div>

            {report?.receiptUrls?.length ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {report.receiptUrls.map((entry, index) => (
                  <a
                    key={`${entry}-${index}`}
                    href={resolveReceiptUrl(entry)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-[#FAF8F5] px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:border-[#F3DFD8] hover:bg-[#FFF8F5] hover:text-[#E04F33]"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-[#E04F33]" />
                    <span>Abrir comprovante {index + 1}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-stone-200 bg-[#FAF8F5] p-4 text-sm text-stone-600">
                Nenhum comprovante foi anexado a esta prestação de contas.
              </p>
            )}
          </section>
        </article>
      </main>

      {lightbox && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95 p-4 backdrop-blur-xs"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-5 top-5 z-20 rounded-full bg-white/15 p-3 text-white transition-colors hover:bg-white/25"
            aria-label="Fechar visualização"
          >
            <X className="h-5 w-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPhotoIndex((photoIndex - 1 + photos.length) % photos.length);
                }}
                className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 sm:left-6"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPhotoIndex((photoIndex + 1) % photos.length);
                }}
                className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 sm:right-6"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="relative flex max-h-[90vh] max-w-5xl flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <img
              src={photos[photoIndex]}
              alt={`Foto ampliada ${photoIndex + 1} de ${photos.length}`}
              className="max-h-[82vh] max-w-full rounded-2xl object-contain"
            />
            {photos.length > 1 && (
              <span className="mt-3 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-white">
                {photoIndex + 1} de {photos.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultadoDetalhePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF8F5] grid place-items-center text-sm font-medium text-stone-600">
          Carregando resultado…
        </main>
      }
    >
      <ResultadoDetalheContent />
    </Suspense>
  );
}
