'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Building2, 
  Eye, 
  LogOut, 
  Layers, 
  Check, 
  X,
  Calendar,
  MapPin,
  ShieldCheck,
  Users,
  Clock,
  CheckCircle,
  LoaderCircle,
  XCircle,
  Phone,
  Mail,
  User as UserIcon,
  Search,
  ExternalLink,
  AlertCircle,
  Sparkles,
  FileCheck2,
  Quote,
  Pencil
} from 'lucide-react';
import { Organization, Campaign, VerificationRequest, User, CadastralRequest } from '@/types';
import { 
  setStoredLoggedInOrg,
  setStoredLoggedInUser
} from '@/lib/storage';
import { 
  fetchOrganizations, 
  fetchCampaigns, 
  createCampaignInDb, 
  updateCampaignInDb,
  concludeCampaignWithReport, 
  deleteCampaignFromDb, 
  fetchVerificationRequests,
  approveVerificationRequestInDb,
  updateVerificationRequestStatusInDb,
  fetchUsers,
  fetchUserById,
  deleteUserFromDb,
  deleteOrganizationFromDb
  , fetchCadastralRequests
  , reviewCadastralRequestInDb
} from '@/services/database';
import { NewCampaignModal } from '@/components/NewCampaignModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { HelpSupportButton } from '@/components/HelpSupportButton';
import { supabase } from '@/lib/supabase';

const ORGANIZATION_CATEGORY_LABELS: Record<string, string> = {
  lar_idosos: 'Lar de Idosos',
  orfanato: 'Acolhimento Infantojuvenil',
  igreja: 'Igreja / Pastoral Social',
  ong: 'ONG / Associação',
  assistencia_social: 'Assistência Social Geral'
};

function formatRequestedAt(value: string): string {
  if (!value) return 'Data não informada';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export default function PainelPage() {
  const router = useRouter();

  // Sessão atual
  const [currentLoggedInUser, setCurrentLoggedInUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Dados globais
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [allRequests, setAllRequests] = useState<VerificationRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [cadastralRequests, setCadastralRequests] = useState<CadastralRequest[]>([]);

  // Abas do Painel
  // Para Mestre: 'solicitacoes' | 'instituicoes' | 'campanhas' | 'usuarios'
  const [masterTab, setMasterTab] = useState<'solicitacoes' | 'instituicoes' | 'campanhas' | 'usuarios'>('solicitacoes');
  // Submenu / Filtro das Campanhas da Entidade: 'ativas' | 'finalizadas' | 'resultados'
  const [entityFilter, setEntityFilter] = useState<'ativas' | 'finalizadas' | 'resultados'>('ativas');

  // Estados de Notificação / Feedback
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; confirmLabel: string; action: () => Promise<void> | void } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);

  // Filtros internos do Mestre
  const [requestFilter, setRequestFilter] = useState<'todas' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');

  // Modal de Criação de Campanha (Entidade)
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [campaignPendingConclusion, setCampaignPendingConclusion] = useState<Campaign | null>(null);

  // Modal de Prestação de Contas (Entidade)
  const [campaignToConclude, setCampaignToConclude] = useState<Campaign | null>(null);
  const [reportTotalCollected, setReportTotalCollected] = useState('');
  const [reportAchievedSummary, setReportAchievedSummary] = useState('');
  const [reportTestimonial, setReportTestimonial] = useState('');
  const [reportPhotoUrl, setReportPhotoUrl] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const runConfirmation = async () => {
    if (!confirmation) return;
    setIsConfirming(true);
    try {
      await confirmation.action();
      setConfirmation(null);
    } finally {
      setIsConfirming(false);
    }
  };

  // Carregar sessão e dados
  useEffect(() => {
    let isMounted = true;

    const loadSecureSession = async () => {
      if (!supabase) {
        router.replace('/login');
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace('/login');
        return;
      }

      const user = await fetchUserById(authData.user.id);
      if (!user) {
        await supabase.auth.signOut();
        router.replace('/login');
        return;
      }

      const [camps, orgs, reqs, usersList, changes] = await Promise.all([
        fetchCampaigns(),
        fetchOrganizations(),
        fetchVerificationRequests(),
        fetchUsers(),
        fetchCadastralRequests()
      ]);
      if (!isMounted) return;

      const org = user.organizationId ? orgs.find((item) => item.id === user.organizationId) || null : null;
      setStoredLoggedInUser(user);
      setStoredLoggedInOrg(org);
      setCurrentLoggedInUser(user);
      setCurrentOrg(org);
      setAllCampaigns(camps);
      setAllOrganizations(orgs);
      setAllRequests(reqs);
      setAllUsers(usersList);
      setCadastralRequests(changes);
      setIsLoadingSession(false);
    };

    void loadSecureSession();
    return () => { isMounted = false; };
  }, [router]);

  const showFeedback = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  // Logout
  const handleLogout = () => {
    void supabase?.auth.signOut();
    setStoredLoggedInUser(null);
    setStoredLoggedInOrg(null);
    router.push('/login');
  };

  // =========================================================================
  // AÇÕES EXCLUSIVAS DO ADMINISTRADOR MESTRE
  // =========================================================================

  // Aprovar Solicitação de Credenciamento
  const handleApproveRequest = async (req: VerificationRequest) => {
    if (approvingRequestId) return;
    setApprovingRequestId(req.id);
    try {
      const { org: newOrg, user: newUser, reusedExistingAccount } = await approveVerificationRequestInDb(req);

      // Atualiza estados locais
      setAllRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'aprovado' } : r))
      );
      setAllOrganizations((prev) => [newOrg, ...prev.filter((o) => o.id !== newOrg.id)]);
      setAllUsers((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id)]);

      showFeedback(
        reusedExistingAccount
          ? `"${req.orgName}" aprovada! O acesso foi vinculado à conta existente de ${newUser.email}.`
          : `"${req.orgName}" aprovada. O convite para definir a senha foi enviado para ${newUser.email}.`
      );
    } catch (err) {
      console.error('Erro ao aprovar solicitação:', err);
      alert(err instanceof Error ? err.message : 'Erro ao processar aprovação.');
    } finally {
      setApprovingRequestId(null);
    }
  };

  // Recusar Solicitação
  const handleRejectRequest = async (reqId: string) => {
    setConfirmation({
      title: 'Recusar solicitação?',
      description: 'A organização será informada de que o credenciamento não foi aprovado.',
      confirmLabel: 'Recusar solicitação',
      action: async () => {
        await updateVerificationRequestStatusInDb(reqId, 'rejeitado');
        setAllRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: 'rejeitado' } : r)));
        showFeedback('Solicitação marcada como recusada.');
      }
    });
  };

  const handleReviewCadastralRequest = async (request: CadastralRequest, decision: 'aprovar' | 'rejeitar') => {
    const review = async () => {
      try {
      await reviewCadastralRequestInDb(request.id, decision);
      setCadastralRequests((items) => items.map((item) => item.id === request.id ? { ...item, status: decision === 'aprovar' ? 'aprovado' : 'rejeitado' } : item));
      showFeedback(decision === 'aprovar' ? 'Alteração cadastral aprovada e aplicada.' : 'Solicitação cadastral recusada.');
      } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível revisar a solicitação.');
      }
    };
    if (decision === 'rejeitar') {
      setConfirmation({ title: 'Recusar alteração?', description: 'A solicitação cadastral será marcada como recusada.', confirmLabel: 'Recusar alteração', action: review });
      return;
    }
    await review();
  };

  // Excluir Campanha (Mestre ou Entidade)
  const handleDeleteCampaign = async (campaignId: string) => {
    setConfirmation({
      title: 'Excluir campanha?',
      description: 'A campanha será removida do mural e essa ação não poderá ser desfeita.',
      confirmLabel: 'Excluir campanha',
      action: async () => {
        await deleteCampaignFromDb(campaignId);
        setAllCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
        showFeedback('Campanha removida com sucesso.');
      }
    });
  };

  // Excluir Usuário (Mestre)
  const handleDeleteUser = async (userId: string) => {
    if (userId === currentLoggedInUser?.id) {
      alert('Você não pode excluir sua própria conta de Administrador Mestre em uso.');
      return;
    }
    setConfirmation({
      title: 'Revogar acesso?',
      description: 'Esta pessoa perderá o acesso ao painel da organização.',
      confirmLabel: 'Revogar acesso',
      action: async () => {
        try {
          await deleteUserFromDb(userId);
          setAllUsers((prev) => prev.filter((u) => u.id !== userId));
          showFeedback('Acesso do usuário revogado com sucesso.');
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Não foi possível revogar o acesso.');
        }
      }
    });
  };

  // Excluir Instituição (Mestre)
  const handleDeleteOrganization = async (org: Organization) => {
    setConfirmation({
      title: `Excluir "${org.name}"?`,
      description: 'A instituição, suas campanhas no mural e o acesso exclusivo vinculado a ela serão removidos permanentemente.',
      confirmLabel: 'Excluir instituição',
      action: async () => {
        try {
          const { deletedUserIds } = await deleteOrganizationFromDb(org.id);
          setAllOrganizations((prev) => prev.filter((o) => o.id !== org.id));
          setAllCampaigns((prev) => prev.filter((c) => c.organizationId !== org.id));
          if (deletedUserIds.length > 0) {
            setAllUsers((prev) => prev.filter((u) => !deletedUserIds.includes(u.id)));
          }
          showFeedback(`"${org.name}" excluída com sucesso.`);
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Não foi possível excluir a instituição.');
        }
      }
    });
  };

  // =========================================================================
  // AÇÕES DO REPRESENTANTE DE ENTIDADE
  // =========================================================================

  const handleCreateCampaign = async (campData: Omit<Campaign, 'id' | 'createdAt' | 'status'>) => {
    const newCamp: Campaign = {
      ...campData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
      viewsCount: 1,
      status: 'ativa'
    };

    const saved = await createCampaignInDb(newCamp);
    setAllCampaigns((prev) => [saved, ...prev]);
    setIsNewCampaignOpen(false);
    showFeedback('Campanha publicada com sucesso no mural de Rio Claro!');
  };

  const handleUpdateCampaign = async (campaign: Campaign) => {
    const saved = await updateCampaignInDb(campaign);
    setAllCampaigns((prev) => prev.map((item) => item.id === saved.id ? saved : item));
    setCampaignToEdit(null);
    setIsNewCampaignOpen(false);
    showFeedback('Campanha atualizada com sucesso.');
  };

  const openCampaignEditor = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
    setIsNewCampaignOpen(true);
  };

  const handleOpenConcludeModal = (camp: Campaign) => {
    const today = new Date().toISOString().slice(0, 10);
    if (camp.deadlineDate > today) {
      setCampaignPendingConclusion(camp);
      return;
    }
    router.push(`/painel/campanhas/${camp.id}/prestacao-contas`);
  };

  const confirmEarlyConclusion = () => {
    if (!campaignPendingConclusion) return;
    router.push(`/painel/campanhas/${campaignPendingConclusion.id}/prestacao-contas`);
    setCampaignPendingConclusion(null);
  };

  const handleConcludeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignToConclude) return;

    setIsSubmittingReport(true);
    const report = {
      completedAt: new Date().toISOString().split('T')[0],
      totalCollected: reportTotalCollected.trim() || 'Arrecadação concluída com sucesso',
      achievedSummary: reportAchievedSummary.trim(),
      photoUrl: reportPhotoUrl.trim() || campaignToConclude.imageUrl,
      testimonial: reportTestimonial.trim() || undefined
    };

    const updated = await concludeCampaignWithReport(campaignToConclude.id, report);
    if (updated) {
      setAllCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showFeedback('Prestação de contas registrada! A campanha foi arquivada na aba de Resultados.');
    }
    setIsSubmittingReport(false);
    setCampaignToConclude(null);
  };

  // Campanhas específicas da entidade logada
  const entityCampaigns = useMemo(() => {
    if (!currentOrg) return [];
    return allCampaigns.filter((c) => c.organizationId === currentOrg.id);
  }, [allCampaigns, currentOrg]);

  const activeEntityCampaigns = useMemo(() => {
    return entityCampaigns.filter((c) => c.status === 'ativa');
  }, [entityCampaigns]);

  const completedEntityCampaigns = useMemo(() => {
    return entityCampaigns.filter((c) => c.status === 'concluida');
  }, [entityCampaigns]);

  // Cálculos de Métricas para o Mestre
  const masterMetrics = useMemo(() => {
    const totalActiveOrgs = allOrganizations.filter((o) => o.status === 'aprovado' || o.verified).length;
    const pendingRequests = allRequests.filter((r) => r.status === 'pendente').length + cadastralRequests.filter((r) => r.status === 'pendente').length;
    const activeCityCampaigns = allCampaigns.filter((c) => c.status === 'ativa').length;
    const totalCityViews = allCampaigns.reduce((sum, c) => sum + (c.viewsCount || 0), 0);
    const completedCityCampaigns = allCampaigns.filter((c) => c.status === 'concluida').length;

    return {
      totalActiveOrgs,
      pendingRequests,
      activeCityCampaigns,
      totalCityViews,
      completedCityCampaigns
    };
  }, [allOrganizations, allRequests, allCampaigns, cadastralRequests]);

  // Filtros das Solicitações no Painel Mestre
  const filteredRequests = useMemo(() => {
    if (requestFilter === 'todas') return allRequests;
    return allRequests.filter((r) => r.status === requestFilter);
  }, [allRequests, requestFilter]);

  // Filtro de Instituições no Painel Mestre
  const filteredOrganizations = useMemo(() => {
    if (!orgSearchQuery.trim()) return allOrganizations;
    const q = orgSearchQuery.toLowerCase();
    return allOrganizations.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.neighborhood.toLowerCase().includes(q) ||
        (o.cnpj && o.cnpj.includes(q))
    );
  }, [allOrganizations, orgSearchQuery]);

  // Filtro de Campanhas no Mural da Cidade (Mestre)
  const filteredCityCampaigns = useMemo(() => {
    if (!campaignSearchQuery.trim()) return allCampaigns;
    const q = campaignSearchQuery.toLowerCase();
    return allCampaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.organizationName.toLowerCase().includes(q) ||
        c.neighborhood.toLowerCase().includes(q)
    );
  }, [allCampaigns, campaignSearchQuery]);

  // Filtro de Usuários no Painel Mestre
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return allUsers;
    const q = userSearchQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organizationName && u.organizationName.toLowerCase().includes(q))
    );
  }, [allUsers, userSearchQuery]);

  const isMasterUser = currentLoggedInUser?.role === 'mestre';

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 relative animate-pulse mb-3">
          <Image
            src="/logo-icon.png"
            alt="Apoia Rio Claro"
            width={48}
            height={48}
            priority
            className="w-12 h-12 object-contain"
          />
        </div>
        <p className="text-stone-600 text-sm font-semibold">Carregando painel de controle...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      
      {campaignPendingConclusion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="early-conclusion-title" className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h2 id="early-conclusion-title" className="mt-4 text-xl font-bold text-slate-900 font-display">Encerrar antes do prazo?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">A campanha <strong>{campaignPendingConclusion.title}</strong> tem prazo até {new Date(campaignPendingConclusion.deadlineDate).toLocaleDateString('pt-BR')}. Ao continuar, você será direcionado para a prestação de contas.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setCampaignPendingConclusion(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Manter campanha ativa</button>
              <button type="button" onClick={confirmEarlyConclusion} className="rounded-xl bg-[#0D4183] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#09336A] cursor-pointer">Sim, concluir campanha</button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CABEÇALHO DO PAINEL (MESTRE OU ENTIDADE)
         ========================================================= */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          
          {/* Identificação Esquerda */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Logo
              href="/"
              iconSize={40}
              textSize="text-xl sm:text-2xl"
              textClassName="hidden sm:inline-block"
              priority
            />

            <div className="h-6 w-px bg-stone-200 hidden min-[480px]:block" />

            <span className="hidden min-[480px]:block text-sm font-bold text-stone-900 font-display truncate max-w-[180px] lg:max-w-xs">
              {isMasterUser ? 'Gestão Geral' : (currentOrg?.name || 'Painel da Entidade')}
            </span>
          </div>

          {/* Centro: Navegação principal da Entidade */}
          {!isMasterUser && (
            <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-full border border-stone-200/70">
              <Link
                href="/painel"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0D4183] text-white shadow-xs transition-colors"
              >
                Campanhas
              </Link>
              <Link
                href="/painel/perfil"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
              >
                Perfil e Dados
              </Link>
            </nav>
          )}

          {/* Ações da Direita */}
          <div className="flex items-center gap-1 sm:gap-2">
            {!isMasterUser && (
              <Link
                href="/painel/perfil"
                className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Perfil</span>
              </Link>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <span>Ver mural</span>
            </Link>

            <HelpSupportButton />

            <div className="h-4 w-px bg-stone-200 mx-0.5" />

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>

        </div>
      </header>

      {/* =========================================================
          BARRA DE SUBMENU SUPERIOR DEDICADA (SECONDARY NAV)
         ========================================================= */}
      {isMasterUser && (
        <div className="bg-white border-b border-stone-200 sticky top-16 sm:top-18 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Submenu do Modo Mestre */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-stone-100 rounded-2xl overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setMasterTab('solicitacoes')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  masterTab === 'solicitacoes'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <span>Solicitações</span>
                {masterMetrics.pendingRequests > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#E04F33] text-white rounded-full text-[10px] font-mono leading-none">
                    {masterMetrics.pendingRequests}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMasterTab('instituicoes')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  masterTab === 'instituicoes'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Instituições</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  masterTab === 'instituicoes' ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {allOrganizations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMasterTab('campanhas')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  masterTab === 'campanhas'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-stone-600" />
                <span>Mural da Cidade</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  masterTab === 'campanhas' ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {allCampaigns.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMasterTab('usuarios')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  masterTab === 'usuarios'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-stone-600" />
                <span>Usuários</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  masterTab === 'usuarios' ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {allUsers.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Feedback Global */}
      {actionSuccessMessage && (
        <div className="bg-[#1C1917] text-white border-b border-stone-800 py-2.5 px-4 animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E04F33] shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          CORPO PRINCIPAL DO PAINEL
         ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ===================================================================
            MODO 1: PAINEL DO ADMINISTRADOR MESTRE
           =================================================================== */}
        {isMasterUser ? (
          <div className="space-y-6">
            
            {/* Visão geral: uma única faixa, sem competir com a fila de trabalho */}
            <section className="bg-white rounded-2xl border border-stone-200 px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Visão geral</p>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-stone-900 font-display">O que precisa da sua atenção</h1>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-6 gap-y-3 text-sm">
                  <div className="sm:border-r sm:border-stone-200 sm:pr-6">
                    <span className="block text-2xl font-bold text-[#E04F33] font-display">{masterMetrics.pendingRequests}</span>
                    <span className="text-xs text-stone-500">aguardando curadoria</span>
                  </div>
                  <div className="sm:border-r sm:border-stone-200 sm:pr-6">
                    <span className="block text-2xl font-bold text-stone-900 font-display">{masterMetrics.totalActiveOrgs}</span>
                    <span className="text-xs text-stone-500">organizações ativas</span>
                  </div>
                  <div className="sm:border-r sm:border-stone-200 sm:pr-6">
                    <span className="block text-2xl font-bold text-stone-900 font-display">{masterMetrics.activeCityCampaigns}</span>
                    <span className="text-xs text-stone-500">campanhas no mural</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold text-emerald-700 font-display">{masterMetrics.completedCityCampaigns}</span>
                    <span className="text-xs text-stone-500">resultados publicados</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ===============================================================
                ABA MESTRE 1: CURADORIA E SOLICITAÇÕES
               =============================================================== */}
            {masterTab === 'solicitacoes' && (
              <div className="space-y-4">
                
                {/* Topo da Aba */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 font-display">
                      Solicitações para revisar
                    </h2>
                    <p className="text-xs text-stone-500">
                      Confira os dados da organização antes de liberar o acesso ao painel.
                    </p>
                  </div>

                  {/* Filtro de Status das Solicitações */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setRequestFilter('pendente')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        requestFilter === 'pendente' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-500'
                      }`}
                    >
                      Pendentes ({allRequests.filter((r) => r.status === 'pendente').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestFilter('aprovado')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        requestFilter === 'aprovado' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-500'
                      }`}
                    >
                      Aprovadas ({allRequests.filter((r) => r.status === 'aprovado').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestFilter('todas')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        requestFilter === 'todas' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-500'
                      }`}
                    >
                      Todas ({allRequests.length})
                    </button>
                  </div>
                </div>

                {cadastralRequests.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-stone-800">Alterações cadastrais e encerramentos</h3>
                      <span className="text-xs text-stone-500">{cadastralRequests.filter((item) => item.status === 'pendente').length} pendente(s)</span>
                    </div>
                    {cadastralRequests.map((request) => (
                      <div key={request.id} className="bg-white rounded-2xl border border-stone-200 border-l-4 border-l-amber-500 p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-start sm:justify-between">
                          <div>
                            <h4 className="font-bold text-stone-900">{request.organizationName}</h4>
                            <p className="text-xs text-stone-500 mt-1">{request.type === 'pix' ? 'Chave Pix' : request.type === 'sede' ? 'Endereço da sede' : request.type === 'razao' ? 'Razão social' : request.type === 'encerramento' ? 'Encerramento da conta' : 'Outros dados'} · {new Date(request.requestedAt).toLocaleString('pt-BR')}</p>
                          </div>
                          {request.status === 'pendente' && request.type !== 'encerramento' && (
                            <div className="flex gap-2 shrink-0">
                              <button type="button" onClick={() => handleReviewCadastralRequest(request, 'aprovar')} className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 cursor-pointer">Aprovar</button>
                              <button type="button" onClick={() => handleReviewCadastralRequest(request, 'rejeitar')} className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 cursor-pointer">Recusar</button>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-stone-700 bg-stone-50 rounded-xl p-3">
                          <p><strong>Novo dado:</strong> {request.details}{request.pixKeyType ? ` (${request.pixKeyType})` : ''}</p>
                          {request.pixBeneficiary && <p className="mt-1"><strong>Titular Pix:</strong> {request.pixBeneficiary}</p>}
                          <p className="mt-1"><strong>Justificativa:</strong> {request.justification}</p>
                          {request.scheduledFor && <p className="mt-1 text-amber-800"><strong>Encerramento programado:</strong> {new Date(request.scheduledFor).toLocaleDateString('pt-BR')}</p>}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-2">
                    <CheckCircle className="w-8 h-8 text-stone-300 mx-auto" />
                    <h3 className="font-bold text-stone-800 text-sm">Nenhuma solicitação encontrada neste filtro</h3>
                    <p className="text-xs text-stone-500">
                      Não há registros pendentes de credenciamento no momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-stone-200 border-l-4 border-l-[#E04F33] p-5 sm:p-6 shadow-xs space-y-5"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-stone-900 font-display">
                                {req.orgName}
                              </h3>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                req.status === 'pendente'
                                  ? 'bg-[#FFF4F1] text-[#E04F33] border border-[#FCDAD1]'
                                  : req.status === 'aprovado'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-stone-100 text-stone-600'
                              }`}>
                                {req.status === 'pendente' ? 'Pendente' : req.status === 'aprovado' ? 'Ativa' : 'Recusada'}
                              </span>
                            </div>
                            <span className="text-xs text-stone-500">
                              Solicitado em {formatRequestedAt(req.requestedAt)} · Causa: <strong>{ORGANIZATION_CATEGORY_LABELS[req.category] || req.category}</strong>
                            </span>
                          </div>

                          {/* Botões de Decisão do Mestre */}
                          {req.status === 'pendente' && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req)}
                                disabled={Boolean(approvingRequestId)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer shadow-xs disabled:cursor-wait disabled:opacity-60"
                              >
                                {approvingRequestId === req.id ? <LoaderCircle className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                                <span>{approvingRequestId === req.id ? 'Criando acesso...' : 'Aprovar e Criar Acesso'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectRequest(req.id)}
                                disabled={Boolean(approvingRequestId)}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Recusar</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Dados Detalhados da Entidade */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-600 border-y border-stone-100 py-4">
                          <div>
                            <span className="text-stone-400 block mb-0.5">Responsável:</span>
                            <span className="font-semibold text-stone-800">{req.responsibleName}</span>
                            {req.responsibleRole && <span className="block text-stone-500">({req.responsibleRole})</span>}
                          </div>

                          <div>
                            <span className="text-stone-400 block mb-0.5">Contatos:</span>
                            <span className="block font-medium">WhatsApp: {req.whatsapp}</span>
                            {req.email && <span className="block font-mono text-[11px] truncate">E-mail: {req.email}</span>}
                          </div>

                          <div>
                            <span className="text-stone-400 block mb-0.5">Localização:</span>
                            <span className="font-medium">{req.neighborhood}, Rio Claro</span>
                            {req.cnpj && <span className="block font-mono text-[11px]">CNPJ: {req.cnpj}</span>}
                          </div>
                        </div>

                        {/* Justificativa / Finalidade */}
                        <div className="border-l-2 border-stone-200 pl-3.5 text-xs text-stone-700">
                          <strong className="text-stone-900 block mb-1">Finalidade declarada</strong>
                          <p className="leading-relaxed">{req.purpose}</p>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* ===============================================================
                ABA MESTRE 2: INSTITUIÇÕES DE RIO CLARO
               =============================================================== */}
            {masterTab === 'instituicoes' && (
              <div className="space-y-4">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 font-display">
                      Instituições Cadastradas na Cidade ({filteredOrganizations.length})
                    </h2>
                    <p className="text-xs text-stone-500">
                      Entidades credenciadas aptas a publicar campanhas no mural público.
                    </p>
                  </div>

                  {/* Campo de Busca Rápida */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, bairro..."
                      value={orgSearchQuery}
                      onChange={(e) => setOrgSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOrganizations.map((org) => {
                    const activeCount = allCampaigns.filter(
                      (c) => c.organizationId === org.id && c.status === 'ativa'
                    ).length;

                    return (
                      <div
                        key={org.id}
                        className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-stone-900 text-base">{org.name}</h3>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Credenciada
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {org.neighborhood}, Rio Claro · {org.categoryLabel}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 whitespace-nowrap">
                              {activeCount} {activeCount === 1 ? 'campanha' : 'campanhas'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrganization(org)}
                              className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={`Excluir instituição ${org.name}`}
                              aria-label={`Excluir instituição ${org.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 bg-[#FAF8F5] p-3 rounded-xl border border-stone-200">
                          <div>
                            <span className="text-stone-400 block text-[10px]">CNPJ:</span>
                            <span className="font-mono">{org.cnpj || 'Não informado'}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Chave Pix:</span>
                            <span className="font-mono truncate block" title={org.pixKey || 'Não cadastrada'}>
                              {org.pixKey || 'Pendente'}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Responsável:</span>
                            <span>{org.contactPerson || 'Diretoria'}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">WhatsApp:</span>
                            <span>{org.whatsapp}</span>
                          </div>
                        </div>

                        <div className="text-xs text-stone-500 line-clamp-2">
                          {org.description}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ===============================================================
                ABA MESTRE 3: MURAL DA CIDADE (TODAS AS CAMPANHAS)
               =============================================================== */}
            {masterTab === 'campanhas' && (
              <div className="space-y-4">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 font-display">
                      Todas as Campanhas de Rio Claro ({filteredCityCampaigns.length})
                    </h2>
                    <p className="text-xs text-stone-500">
                      Supervisão geral das publicações ativas e concluídas na cidade.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Buscar campanha ou entidade..."
                      value={campaignSearchQuery}
                      onChange={(e) => setCampaignSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredCityCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={camp.imageUrl}
                          alt={camp.title}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 bg-stone-100"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              camp.status === 'ativa'
                                ? 'bg-stone-900 text-white'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {camp.status === 'ativa' ? 'Ativa no Mural' : 'Concluída'}
                            </span>
                            <span className="text-xs font-semibold text-stone-700">
                              {camp.organizationName}
                            </span>
                            <span className="text-xs text-stone-400">
                              · {camp.neighborhood}
                            </span>
                          </div>

                          <h3 className="font-bold text-stone-900 text-base leading-snug">
                            {camp.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-stone-400" />
                              {camp.viewsCount || 0} visualizações
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              Prazo: {new Date(camp.deadlineDate).toLocaleDateString('pt-BR')}
                            </span>
                            {camp.resultReport && (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Prestação de contas realizada
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ação de Moderação do Mestre */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          title="Remover campanha do mural"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ===============================================================
                ABA MESTRE 4: USUÁRIOS DO SISTEMA
               =============================================================== */}
            {masterTab === 'usuarios' && (
              <div className="space-y-4">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 font-display">
                      Contas e Acessos ao Sistema ({filteredUsers.length})
                    </h2>
                    <p className="text-xs text-stone-500">
                      Relação de contas com permissão de login no Apoia Rio Claro.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, e-mail..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                  <div className="divide-y divide-stone-100">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-stone-900 text-sm sm:text-base">
                              {u.name}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              u.role === 'mestre'
                                ? 'bg-stone-900 text-white'
                                : 'bg-[#FFF4F1] text-[#E04F33] border border-[#FCDAD1]'
                            }`}>
                              {u.role === 'mestre' ? 'Administrador Mestre' : 'Representante'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                            <span className="font-mono text-stone-700">{u.email}</span>
                            {u.organizationName && (
                              <span>Instituição: <strong>{u.organizationName}</strong></span>
                            )}
                            {u.phone && <span>Telefone: {u.phone}</span>}
                          </div>
                        </div>

                        {/* Ação: Não pode deletar o próprio mestre logado */}
                        {u.id !== currentLoggedInUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer self-end sm:self-center"
                            title="Revogar acesso deste usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        ) : (
          /* ===================================================================
              MODO 2: PAINEL DO REPRESENTANTE DE ENTIDADE (FOCO EM CAMPANHAS)
             =================================================================== */
          <div className="space-y-6">
            
            {/* Cabeçalho de ações das campanhas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
                  Minhas Campanhas
                </h1>
                <p className="text-xs sm:text-sm text-stone-500">
                  Gerencie suas campanhas ativas no mural e registre resultados ao final de cada ação.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCampaignToEdit(null);
                  setIsNewCampaignOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84228] transition-colors shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Campanha</span>
              </button>
            </div>

            {/* Atalhos de campanhas da entidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button type="button" onClick={() => setEntityFilter('ativas')} className={`p-5 rounded-2xl border text-left shadow-xs transition-all cursor-pointer ${entityFilter === 'ativas' ? 'border-[#0D4183] bg-blue-50 ring-2 ring-blue-100' : 'border-stone-200/90 bg-white hover:border-blue-200 hover:shadow-sm'}`}>
                <span className="text-xs font-semibold text-stone-500 block">Campanhas Ativas</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-stone-900 font-display">{activeEntityCampaigns.length}</span>
                  <span className="text-xs text-stone-400">no ar no mural</span>
                </div>
              </button>

              <button type="button" onClick={() => setEntityFilter('finalizadas')} className={`p-5 rounded-2xl border text-left shadow-xs transition-all cursor-pointer ${entityFilter === 'finalizadas' ? 'border-[#0D4183] bg-blue-50 ring-2 ring-blue-100' : 'border-stone-200/90 bg-white hover:border-blue-200 hover:shadow-sm'}`}>
                <span className="text-xs font-semibold text-stone-500 block">Finalizadas</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-stone-900 font-display">{completedEntityCampaigns.length}</span>
                  <span className="text-xs text-stone-400">concluídas e prestadas</span>
                </div>
              </button>

              <button type="button" onClick={() => setEntityFilter('resultados')} className={`p-5 rounded-2xl border text-left shadow-xs transition-all cursor-pointer ${entityFilter === 'resultados' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100' : 'border-stone-200/90 bg-white hover:border-emerald-200 hover:shadow-sm'}`}>
                <span className="text-xs font-semibold text-stone-500 block">Meus Resultados</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-700 font-display">{completedEntityCampaigns.filter((campaign) => campaign.resultReport).length}</span>
                  <span className="text-xs text-stone-400">prestações publicadas</span>
                </div>
              </button>
            </div>

            {/* FILTRO 1: CAMPANHAS ATIVAS */}
                {entityFilter === 'ativas' && (
                  <div className="space-y-4">
                    {activeEntityCampaigns.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
                        <Layers className="w-8 h-8 text-stone-300 mx-auto" />
                        <h3 className="text-base font-bold text-stone-800">Nenhuma campanha ativa no momento</h3>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          Publique pedidos de alimentos, adesões de almoço beneficente, agasalhos ou cartinhas de apadrinhamento para mobilizar a comunidade.
                        </p>
                        <button
                          onClick={() => setIsNewCampaignOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Publicar Nova Campanha</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeEntityCampaigns.map((camp) => (
                          <div
                            key={camp.id}
                            className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                          >
                            <div className="flex items-start gap-3.5">
                              <img
                                src={camp.imageUrl}
                                alt={camp.title}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-stone-100"
                              />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-900 text-white">
                                    Ativa no Mural
                                  </span>
                                  <span className="text-xs text-stone-500 font-medium">
                                    {camp.categoryLabel}
                                  </span>
                                </div>

                                <h3 className="font-bold text-stone-900 text-base leading-snug">
                                  {camp.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5 text-stone-400" />
                                    {camp.viewsCount || 0} visualizações
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                    Prazo: {new Date(camp.deadlineDate).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => openCampaignEditor(camp)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0D4183] bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenConcludeModal(camp)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" />
                                <span>Concluir campanha</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCampaign(camp.id)}
                                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Excluir campanha"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* FILTRO 2: CAMPANHAS FINALIZADAS */}
                {entityFilter === 'finalizadas' && (
                  <div className="space-y-4">
                    {completedEntityCampaigns.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-2">
                        <CheckCircle className="w-8 h-8 text-stone-300 mx-auto" />
                        <h3 className="text-base font-bold text-stone-800">Nenhuma campanha finalizada ainda</h3>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          Quando você concluir uma campanha ativa e prestar contas, ela ficará arquivada neste histórico.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {completedEntityCampaigns.map((camp) => (
                          <div
                            key={camp.id}
                            className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                          >
                            <div className="flex items-start gap-3.5">
                              <img
                                src={camp.imageUrl}
                                alt={camp.title}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-stone-100"
                              />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Finalizada
                                  </span>
                                  <span className="text-xs text-stone-500 font-medium">
                                    {camp.categoryLabel}
                                  </span>
                                </div>

                                <h3 className="font-bold text-stone-900 text-base leading-snug">
                                  {camp.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5 text-stone-400" />
                                    {camp.viewsCount || 0} visualizações
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                    Finalizada em: {camp.resultReport?.completedAt ? new Date(camp.resultReport.completedAt).toLocaleDateString('pt-BR') : new Date(camp.deadlineDate).toLocaleDateString('pt-BR')}
                                  </span>
                                  {camp.resultReport && (
                                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                      <FileCheck2 className="w-3.5 h-3.5" />
                                      Prestação de contas realizada
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {camp.resultReport && (
                                <button
                                  type="button"
                                  onClick={() => router.push(`/painel/campanhas/${camp.id}/prestacao-contas`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0D4183] bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  <span>Editar prestação</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteCampaign(camp.id)}
                                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Excluir do histórico"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* FILTRO 3: MEUS RESULTADOS */}
                {entityFilter === 'resultados' && (
                  <div className="space-y-4">
                    {completedEntityCampaigns.filter((c) => c.resultReport).length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-2">
                        <FileCheck2 className="w-8 h-8 text-stone-300 mx-auto" />
                        <h3 className="text-base font-bold text-stone-800">Nenhuma prestação de contas registrada ainda</h3>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          Ao concluir uma campanha ativa e preencher os dados de arrecadação e fotos de entrega, a prestação de contas aparecerá aqui e no mural público da cidade.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {completedEntityCampaigns.filter((c) => c.resultReport).map((camp) => (
                          <div
                            key={camp.id}
                            className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs p-6 sm:p-8"
                          >
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                              {camp.resultReport?.photoUrl && (
                                <div className="w-full lg:w-72 h-52 rounded-2xl overflow-hidden shrink-0 bg-stone-100">
                                  <img
                                    src={camp.resultReport.photoUrl}
                                    alt={camp.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF4F1] text-[#E04F33] border border-[#FCDAD1] flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Ação Concluída
                                    </span>
                                    <span className="text-xs text-stone-400">
                                      Finalizada em {camp.resultReport?.completedAt ? new Date(camp.resultReport.completedAt).toLocaleDateString('pt-BR') : 'Recentemente'}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="text-xl font-bold text-stone-900 font-display">
                                    {camp.title}
                                  </h3>
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

                                <div className="pt-1">
                                  <Link
                                    href={`/resultados/${camp.id}`}
                                    className="inline-flex items-center justify-center rounded-xl bg-[#E04F33] hover:bg-[#C84127] px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors shadow-xs"
                                  >
                                    Ver página pública
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

          </div>
        )}

      </main>

      {currentOrg && currentLoggedInUser?.role === 'representante' && (
        <button
          type="button"
          onClick={() => setIsNewCampaignOpen(true)}
          className="fixed bottom-5 right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-[#E04F33] px-4 text-sm font-bold text-white shadow-lg shadow-[#E04F33]/30 transition-transform hover:bg-[#C84127] active:scale-95 sm:bottom-7 sm:right-7"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Nova campanha
        </button>
      )}

      {/* =========================================================
          MODAL DE PRESTAÇÃO DE CONTAS (ENTIDADE)
         ========================================================= */}
      {campaignToConclude && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in duration-200 flex flex-col">
            
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="p-5 sm:p-6 border-b border-stone-200 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900 font-display">
                  Prestar Contas e Concluir
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {campaignToConclude.title}
                </p>
              </div>
              <button
                onClick={() => setCampaignToConclude(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConcludeSubmit} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Total Arrecadado / Conquistado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: 420 kg de alimentos ou R$ 8.500,00"
                  value={reportTotalCollected}
                  onChange={(e) => setReportTotalCollected(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Resumo de Aplicação dos Recursos *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="ex: Reformamos o telhado dos dormitórios e garantimos tranquilidade aos acolhidos..."
                  value={reportAchievedSummary}
                  onChange={(e) => setReportAchievedSummary(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Mensagem de Agradecimento aos Doadores (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: Nosso imenso carinho a todos os moradores de Rio Claro..."
                  value={reportTestimonial}
                  onChange={(e) => setReportTestimonial(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Foto da Entrega / Comprovação (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={reportPhotoUrl}
                  onChange={(e) => setReportPhotoUrl(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCampaignToConclude(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReport ? 'Concluindo...' : 'Publicar nos Resultados'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal Nova Campanha */}
      {currentOrg && (
        <NewCampaignModal
          isOpen={isNewCampaignOpen}
          onClose={() => { setIsNewCampaignOpen(false); setCampaignToEdit(null); }}
          organization={currentOrg}
          onCreateCampaign={handleCreateCampaign}
          campaignToEdit={campaignToEdit}
          onUpdateCampaign={handleUpdateCampaign}
        />
      )}

      <ConfirmationModal
        isOpen={Boolean(confirmation)}
        title={confirmation?.title || ''}
        description={confirmation?.description || ''}
        confirmLabel={confirmation?.confirmLabel || 'Confirmar'}
        isConfirming={isConfirming}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void runConfirmation()}
      />

    </div>
  );
}
