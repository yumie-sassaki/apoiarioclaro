'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { SiteFooter } from '@/components/SiteFooter';
import { Campaign, Organization, VerificationRequest, User } from '@/types';
import { 
  getStoredLoggedInOrg,
  getStoredLoggedInUser
} from '@/lib/storage';
import { 
  fetchOrganizations, 
  fetchCampaigns, 
  createCampaignInDb, 
  incrementCampaignViewsInDb, 
  createVerificationRequestInDb 
} from '@/services/database';
import { Header } from '@/components/Header';
import { CampaignCard } from '@/components/CampaignCard';
import { CampaignDetailModal } from '@/components/CampaignDetailModal';
import { OrganizationCard } from '@/components/OrganizationCard';
import { ResultsFeed } from '@/components/ResultsFeed';
import { AboutUsSection } from '@/components/AboutUsSection';
import { RegisterOrgModal } from '@/components/RegisterOrgModal';
import { NewCampaignModal } from '@/components/NewCampaignModal';
import { Search } from 'lucide-react';

export default function Home() {
  // Estados Principais
  const [activeTab, setActiveTab] = useState<'campanhas' | 'entidades' | 'resultados' | 'sobre'>('campanhas');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Autenticação de Representante e Mestre
  const [loggedInOrg, setLoggedInOrg] = useState<Organization | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // Filtros de busca
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('todos');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string | null>(null);

  // Modais
  const [selectedCampaignForModal, setSelectedCampaignForModal] = useState<Campaign | null>(null);
  const [isRegisterOrgOpen, setIsRegisterOrgOpen] = useState(false);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);

  // Carregamento de dados com fallback automático
  useEffect(() => {
    const org = getStoredLoggedInOrg();
    const user = getStoredLoggedInUser();
    setLoggedInOrg(org);
    setLoggedInUser(user);

    // Carregar do Supabase (ou fallback local)
    fetchOrganizations().then(setOrganizations);
    fetchCampaigns().then(setCampaigns);

    const handleAuthChange = () => {
      setLoggedInOrg(getStoredLoggedInOrg());
      setLoggedInUser(getStoredLoggedInUser());
    };
    window.addEventListener('auth-change', handleAuthChange);

    const params = new URLSearchParams(window.location.search);
    if (params.get('nova') === 'campanha') {
      setIsNewCampaignOpen(true);
      window.history.replaceState({}, '', '/');
    }

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  // Lista de bairros disponíveis para filtro
  const neighborhoods = useMemo(() => {
    const list = new Set<string>();
    campaigns.forEach((c) => list.add(c.neighborhood));
    organizations.forEach((o) => list.add(o.neighborhood));
    return Array.from(list);
  }, [campaigns, organizations]);

  // Filtragem de campanhas ativas
  const filteredActiveCampaigns = useMemo(() => {
    return campaigns.filter((camp) => {
      if (camp.status !== 'ativa') return false;

      // Filtro de texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = camp.title.toLowerCase().includes(query);
        const matchesOrg = camp.organizationName.toLowerCase().includes(query);
        const matchesDesc = camp.description.toLowerCase().includes(query);
        const matchesNeigh = camp.neighborhood.toLowerCase().includes(query);
        if (!matchesTitle && !matchesOrg && !matchesDesc && !matchesNeigh) return false;
      }

      // Filtro de categoria
      if (selectedCategory !== 'todas' && camp.category !== selectedCategory) {
        return false;
      }

      // Filtro de bairro
      if (selectedNeighborhood !== 'todos' && camp.neighborhood !== selectedNeighborhood) {
        return false;
      }

      // Filtro por instituição selecionada
      if (selectedOrgFilter && camp.organizationId !== selectedOrgFilter) {
        return false;
      }

      return true;
    });
  }, [campaigns, searchQuery, selectedCategory, selectedNeighborhood, selectedOrgFilter]);

  // Campanhas concluídas (para o mural de resultados)
  const completedCampaigns = useMemo(() => {
    return campaigns.filter((camp) => camp.status === 'concluida');
  }, [campaigns]);

  // Submissão de nova solicitação de entidade
  const handleRegisterOrgRequest = async (data: Omit<VerificationRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest: VerificationRequest = {
      ...data,
      id: crypto.randomUUID(),
      status: 'pendente',
      requestedAt: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    await createVerificationRequestInDb(newRequest);
  };

  // Criação de nova campanha
  const handleCreateCampaign = async (campData: Omit<Campaign, 'id' | 'createdAt' | 'status'>) => {
    const newCamp: Campaign = {
      ...campData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().split('T')[0],
      viewsCount: 1,
      status: 'ativa'
    };

    const saved = await createCampaignInDb(newCamp);
    setCampaigns((prev) => [saved, ...prev]);
    setActiveTab('campanhas');
  };

  // Abrir modal e incrementar contador de visualizações
  const handleOpenCampaignDetails = (camp: Campaign) => {
    incrementCampaignViewsInDb(camp.id);
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === camp.id ? { ...c, viewsCount: (c.viewsCount || 0) + 1 } : c
      )
    );
    setSelectedCampaignForModal({
      ...camp,
      viewsCount: (camp.viewsCount || 0) + 1
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      
      {/* Header Fixo */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loggedInOrg={loggedInOrg}
        loggedInUser={loggedInUser}
        onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* =========================================
            ABA 1: MURAL DE CAMPANHAS ATIVAS
        ========================================= */}
        {activeTab === 'campanhas' && (
          <div className="space-y-6">
            
            {/* Cabeçalho Editorial Enxuto e Direto */}
            <div className="pt-2 sm:pt-4 pb-2">
              <h1 className="text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                Encontre uma causa para apoiar em Rio Claro.
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-stone-600 text-xs sm:text-sm">
                <span>Veja o que está sendo arrecadado e ajude direto a organização.</span>
                <Link
                  href="/como-contribuir"
                  className="text-[#E04F33] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Como ajudar com segurança →
                </Link>
              </div>

              {/* Filtro Ativo por Instituição (se clicado a partir de Instituições) */}
              {selectedOrgFilter && (
                <div className="inline-flex items-center gap-2 bg-[#FFF4F1] border border-[#FCDAD1] px-3 py-1 rounded-full text-xs font-semibold text-[#E04F33] mt-3">
                  <span>Filtrado por instituição selecionada</span>
                  <button
                    onClick={() => setSelectedOrgFilter(null)}
                    className="underline hover:text-[#C84127] font-bold cursor-pointer"
                  >
                    (Limpar filtro)
                  </button>
                </div>
              )}
            </div>

            {/* Barra de Busca + Filtro de Bairro + Pílulas de Categoria */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                {/* Campo de Busca */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar por campanha, instituição, alimento, agasalho..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm placeholder:text-stone-400 text-stone-900 focus:outline-hidden focus:border-stone-900 transition-colors"
                  />
                </div>

                {/* Filtro por Bairro */}
                <div className="sm:w-56 shrink-0">
                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-700 focus:outline-hidden focus:border-stone-900 transition-colors cursor-pointer"
                  >
                    <option value="todos">Todos os Bairros</option>
                    {neighborhoods.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha de pílulas de categoria com scroll horizontal suave no celular */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('todas')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'todas'
                      ? 'bg-[#0D4183] text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-[#EAF2FF]'
                  }`}
                >
                  Todas ({campaigns.filter((c) => c.status === 'ativa').length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('adesao')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'adesao'
                      ? 'bg-[#0D4183] text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-[#EAF2FF]'
                  }`}
                >
                  Almoços e Eventos
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('alimentos')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'alimentos'
                      ? 'bg-[#0D4183] text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-[#EAF2FF]'
                  }`}
                >
                  Alimentos
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('cartinhas')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'cartinhas'
                      ? 'bg-[#0D4183] text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-[#EAF2FF]'
                  }`}
                >
                  Cartinhas
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('agasalho')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'agasalho'
                      ? 'bg-[#0D4183] text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-[#EAF2FF]'
                  }`}
                >
                  Agasalhos
                </button>
              </div>
            </div>

            {/* Grid de Cards de Campanhas */}
            {filteredActiveCampaigns.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
                <Search className="w-8 h-8 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">Nenhuma campanha encontrada</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Tente alterar os termos de busca ou remover os filtros de categoria e bairro.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('todas');
                    setSelectedNeighborhood('todos');
                    setSelectedOrgFilter(null);
                  }}
                  className="text-xs font-bold text-[#E04F33] hover:underline cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActiveCampaigns.map((camp) => (
                  <CampaignCard
                    key={camp.id}
                    campaign={camp}
                    onOpenDetails={handleOpenCampaignDetails}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================
            ABA 2: INSTITUIÇÕES DE RIO CLARO
        ========================================= */}
        {activeTab === 'entidades' && (
          <div className="space-y-6">
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                  Instituições e obras sociais de Rio Claro
                </h1>
                <p className="text-sm text-stone-600 mt-1">
                  Todas as organizações listadas possuem sede física em Rio Claro e foram verificadas pela equipe do Apoia Rio Claro.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterOrgOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#E04F33] bg-[#FFF4F1] hover:bg-[#FFEAE5] border border-[#FCDAD1] transition-colors shrink-0 cursor-pointer"
              >
                + Solicitar Credenciamento
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {organizations.map((org) => {
                const count = campaigns.filter(
                  (c) => c.organizationId === org.id && c.status === 'ativa'
                ).length;
                return (
                  <OrganizationCard
                    key={org.id}
                    organization={org}
                    activeCampaignsCount={count}
                    onFilterByOrg={(orgId) => {
                      setSelectedOrgFilter(orgId);
                      setActiveTab('campanhas');
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            ABA 3: RESULTADOS E TRANSPARÊNCIA
        ========================================= */}
        {activeTab === 'resultados' && (
          <ResultsFeed completedCampaigns={completedCampaigns} />
        )}

        {/* =========================================
            ABA 4: SOBRE NÓS
        ========================================= */}
        {activeTab === 'sobre' && (
          <AboutUsSection
            onGoToCampaigns={() => setActiveTab('campanhas')}
            onOpenRegisterOrg={() => setIsRegisterOrgOpen(true)}
          />
        )}

      </main>

      <SiteFooter />

      {/* Modais Globais */}
      <CampaignDetailModal
        campaign={selectedCampaignForModal}
        organization={selectedCampaignForModal ? organizations.find((org) => org.id === selectedCampaignForModal.organizationId) : null}
        onClose={() => setSelectedCampaignForModal(null)}
      />

      <RegisterOrgModal
        isOpen={isRegisterOrgOpen}
        onClose={() => setIsRegisterOrgOpen(false)}
        onSubmitRequest={handleRegisterOrgRequest}
      />

      {loggedInOrg && (
        <NewCampaignModal
          isOpen={isNewCampaignOpen}
          onClose={() => setIsNewCampaignOpen(false)}
          organization={loggedInOrg}
          onCreateCampaign={handleCreateCampaign}
        />
      )}

    </div>
  );
}
