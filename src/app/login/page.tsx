'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { SiteFooter } from '@/components/SiteFooter';
import { 
  ArrowLeft, 
  ArrowRight, 
  LogOut, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Lock,
  Building2,
  MapPin,
  User as UserIcon,
  Phone
} from 'lucide-react';
import { Organization, VerificationRequest, OrganizationCategory, User } from '@/types';
import { 
  getStoredLoggedInOrg, 
  setStoredLoggedInOrg,
  getStoredLoggedInUser,
  setStoredLoggedInUser
} from '@/lib/storage';
import { 
  fetchOrganizations, 
  createVerificationRequestInDb,
  fetchUserById
} from '@/services/database';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { RegistrationWizard } from '@/components/RegistrationWizard';

export default function LoginPage() {
  const router = useRouter();

  const [currentLoggedInOrg, setCurrentLoggedInOrg] = useState<Organization | null>(null);
  const [currentLoggedInUser, setCurrentLoggedInUser] = useState<User | null>(null);
  
  // Aba ativa: 'login' | 'credenciamento'
  const [activeTab, setActiveTab] = useState<'login' | 'credenciamento'>('login');

  // Form Login: E-mail e Senha
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Form Credenciamento de Nova Entidade
  const [reqOrgName, setReqOrgName] = useState('');
  const [reqCategory, setReqCategory] = useState<OrganizationCategory>('lar_idosos');
  const [reqCnpj, setReqCnpj] = useState('');
  const [reqNeighborhood, setReqNeighborhood] = useState('');
  const [reqResponsibleName, setReqResponsibleName] = useState('');
  const [reqResponsibleEmail, setReqResponsibleEmail] = useState('');
  const [reqWhatsapp, setReqWhatsapp] = useState('');
  const [reqPurpose, setReqPurpose] = useState('');
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSecureSession = async () => {
      if (!supabase) {
        setStoredLoggedInOrg(null);
        setStoredLoggedInUser(null);
        if (isMounted) setIsRestoringSession(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user ? await fetchUserById(data.user.id) : null;
      if (!user) {
        setStoredLoggedInOrg(null);
        setStoredLoggedInUser(null);
        if (isMounted) {
          setCurrentLoggedInOrg(null);
          setCurrentLoggedInUser(null);
          setIsRestoringSession(false);
        }
        return;
      }

      if (!user.active) {
        await supabase.auth.signOut();
        setLoginError('Esta conta foi encerrada ou está em processo de encerramento.');
        return;
      }

      const organizations = user.organizationId ? await fetchOrganizations() : [];
      const organization = user.organizationId
        ? organizations.find((item) => item.id === user.organizationId) || null
        : null;
      if (isMounted) {
        setStoredLoggedInUser(user);
        setStoredLoggedInOrg(organization);
        setCurrentLoggedInUser(user);
        setCurrentLoggedInOrg(organization);
        setIsRestoringSession(false);
      }
    };

    void restoreSecureSession();
    return () => { isMounted = false; };
  }, []);

  // Submissão do Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setLoginError('Por favor, informe seu e-mail cadastrado.');
      return;
    }
    if (!password) {
      setLoginError('Por favor, digite sua senha de acesso.');
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setLoginError('O acesso seguro ainda não foi configurado. Tente novamente em instantes.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authError || !authData.user) {
        setLoginError('E-mail ou senha inválidos. Se for seu primeiro acesso, use o convite recebido por e-mail.');
        return;
      }

      const user = await fetchUserById(authData.user.id);

      if (!user) {
        await supabase.auth.signOut();
        setLoginError('Sua conta ainda não está vinculada a uma organização aprovada.');
        return;
      }

      // Atualiza usuário autenticado
      setStoredLoggedInUser(user);
      setCurrentLoggedInUser(user);

      if (user.role === 'mestre') {
        // Administrador Mestre não tem vínculo fixo com 1 entidade exclusiva
        setStoredLoggedInOrg(null);
        setCurrentLoggedInOrg(null);
        router.push('/painel');
      } else {
        // Representante de Entidade: busca os dados da instituição
        const orgs = await fetchOrganizations();
        let org: Organization | null = null;
        if (user.organizationId) {
          org = orgs.find((o) => o.id === user.organizationId) || null;
        }
        // Fallback por e-mail se não achou por id
        if (!org) {
          org = orgs.find((o) => o.contactEmail?.toLowerCase() === cleanEmail) || orgs[0] || null;
        }

        setStoredLoggedInOrg(org);
        setCurrentLoggedInOrg(org);
        router.push('/painel');
      }
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setLoginError('Erro de conexão ao processar login. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    void supabase?.auth.signOut();
    setStoredLoggedInOrg(null);
    setStoredLoggedInUser(null);
    setCurrentLoggedInOrg(null);
    setCurrentLoggedInUser(null);
  };

  // Submissão do Credenciamento
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqOrgName.trim() || !reqResponsibleName.trim() || !reqWhatsapp.trim() || !reqNeighborhood.trim() || !reqResponsibleEmail.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const newReq: VerificationRequest = {
        id: crypto.randomUUID(),
        orgName: reqOrgName.trim(),
        category: reqCategory,
        cnpj: reqCnpj.trim() || '',
        address: `Rio Claro - SP, Bairro ${reqNeighborhood.trim()}`,
        neighborhood: reqNeighborhood.trim(),
        responsibleName: reqResponsibleName.trim(),
        responsibleRole: 'Responsável Institucional',
        email: reqResponsibleEmail.trim(),
        phone: reqWhatsapp.trim(),
        whatsapp: reqWhatsapp.replace(/\D/g, ''),
        socialMediaOrWebsite: '',
        purpose: reqPurpose.trim() || 'Solicitação de credenciamento no Apoia Rio Claro para publicação de ações sociais.',
        status: 'pendente',
        requestedAt: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      await createVerificationRequestInDb(newReq);
      setRequestSentSuccess(true);
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err);
      alert('Não foi possível enviar a solicitação. Tente novamente.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      
      {/* Header Superior Limpo */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 sm:h-18 flex items-center justify-between">
          <Logo href="/" iconSize={40} textSize="text-xl sm:text-2xl" textClassName="hidden sm:inline-block" priority />

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar<span className="hidden sm:inline"> ao mural</span></span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Centralizado */}
      <main className="flex-1 flex flex-col justify-center px-3 sm:px-4 py-3 sm:py-6">
        <div className="max-w-xl mx-auto w-full">
          
          {/* Se já há usuário logado */}
          {!isRestoringSession && currentLoggedInUser ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-6">
              <div className="space-y-1">
                <span className="text-[11px] sm:text-xs font-bold text-[#E04F33] uppercase tracking-wider block">
                  {currentLoggedInUser.role === 'mestre' 
                    ? 'Sessão Ativa · Administrador Mestre' 
                    : 'Sessão Ativa · Representante da Entidade'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
                  {currentLoggedInUser.name}
                </h2>
                <p className="text-stone-500 text-xs sm:text-sm">
                  {currentLoggedInUser.role === 'mestre'
                    ? 'Governança, Curadoria e Gestão de Todas as Obras'
                    : (currentLoggedInOrg?.name ? `${currentLoggedInOrg.name} — ${currentLoggedInOrg.neighborhood}` : currentLoggedInUser.email)}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border border-stone-200 text-xs space-y-1.5 sm:space-y-2 text-stone-600 font-sans">
                <div><strong>E-mail:</strong> {currentLoggedInUser.email}</div>
                <div><strong>Nível de Acesso:</strong> {currentLoggedInUser.role === 'mestre' ? 'Mestre (Controle Total e Curadoria)' : 'Representante Institucional'}</div>
                {currentLoggedInOrg?.cnpj && <div><strong>CNPJ Vinculado:</strong> {currentLoggedInOrg.cnpj}</div>}
              </div>

              <div className="space-y-2.5 sm:space-y-3 pt-1">
                <Link
                  href="/painel"
                  className="w-full h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-colors shadow-xs"
                >
                  <span>{currentLoggedInUser.role === 'mestre' ? 'Acessar Painel Mestre' : 'Acessar Painel da Entidade'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/"
                  className="w-full h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  <span>Ver Mural Público</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Trocar de Conta (Logout)</span>
                </button>
              </div>
            </div>
          ) : !isRestoringSession ? (
            /* Card Central de Login / Credenciamento */
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-5">
              
              {/* Título e Subtítulo Elegantes */}
              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight font-display">
                  Acesso ao Apoia Rio Claro
                </h1>
                <p className="text-xs sm:text-sm text-stone-500">
                  Entre como Administrador Mestre ou Representante da sua entidade.
                </p>
              </div>

              {/* Segmented Control: [Entrar] [Solicitar Cadastro] */}
              <div className="bg-stone-100 p-1 rounded-xl sm:rounded-2xl flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('credenciamento');
                    setRequestSentSuccess(false);
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer ${
                    activeTab === 'credenciamento'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Solicitar Cadastro
                </button>
              </div>

              {/* ABA ENTRAR */}
              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5 sm:space-y-4">
                  
                  {/* Alerta de Erro */}
                  {loginError && (
                    <div className="p-3 rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <span className="font-medium leading-relaxed">{loginError}</span>
                    </div>
                  )}
                  {/* Campo de E-mail */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      E-mail
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 sm:h-12 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-hidden transition-colors"
                        required
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Campo de Senha */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 sm:h-12 pl-9 pr-10 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-hidden font-mono transition-colors"
                        required
                      />
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer transition-colors"
                        title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Link href="/recuperar-acesso" className="inline-block text-xs font-semibold text-[#0D4183] hover:underline">
                    Esqueci minha senha
                  </Link>

                  {/* Botão Acessar Painel */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoggingIn ? (
                      <span>Acessando...</span>
                    ) : (
                      <>
                        <span>Acessar Painel</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Link para Credenciamento */}
                  <p className="text-center text-xs text-stone-500 pt-1">
                    Sua entidade ainda não é credenciada?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('credenciamento');
                        setRequestSentSuccess(false);
                      }}
                      className="text-[#E04F33] font-bold hover:underline cursor-pointer"
                    >
                      Solicitar cadastro
                    </button>
                  </p>

                </form>
              ) : activeTab === 'credenciamento' ? (
                <div>
                  {requestSentSuccess ? (
                    <div className="text-center py-5 space-y-3 animate-in fade-in">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 font-display">Solicitação enviada</h3>
                      <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">A curadoria vai revisar os dados. Se aprovada, a pessoa responsável receberá um convite por e-mail para criar a própria senha.</p>
                      <button type="button" onClick={() => setActiveTab('login')} className="mt-3 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0D4183] hover:bg-[#08356D] transition-colors cursor-pointer">Ir para o login</button>
                    </div>
                  ) : (
                    <RegistrationWizard onSuccess={() => setRequestSentSuccess(true)} />
                  )}
                </div>
              ) : (
                /* ABA SOLICITAR CADASTRO */
                <div>
                  {requestSentSuccess ? (
                    <div className="text-center py-5 space-y-3 animate-in fade-in">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FFF4F1] border border-[#FCDAD1] text-[#E04F33] flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                        Solicitação Enviada com Sucesso!
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                        Nossa curadoria recebeu seu pedido de credenciamento. Entraremos em contato via WhatsApp com o responsável para validar os dados e habilitar o acesso da instituição.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className="mt-3 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        Ir para o Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRequestSubmit} className="space-y-3">
                      
                      {/* Nome da Instituição */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                          Nome da Instituição / Obra Social *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="ex: Lar São Vicente"
                            value={reqOrgName}
                            onChange={(e) => setReqOrgName(e.target.value)}
                            className="w-full h-11 sm:h-12 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm focus:border-stone-900 focus:outline-hidden"
                            required
                          />
                          <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* CNPJ e Bairro */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                            CNPJ (opcional)
                          </label>
                          <input
                            type="text"
                            placeholder="00.000.000/0001-00"
                            value={reqCnpj}
                            onChange={(e) => setReqCnpj(e.target.value)}
                            className="w-full h-11 sm:h-12 px-3 rounded-xl border border-stone-300 bg-white text-sm font-mono focus:border-stone-900 focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                            Bairro em Rio Claro *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="ex: Centro, Cervezão"
                              value={reqNeighborhood}
                              onChange={(e) => setReqNeighborhood(e.target.value)}
                              className="w-full h-11 sm:h-12 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm focus:border-stone-900 focus:outline-hidden"
                              required
                            />
                            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Tipo de Causa */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                          Tipo de Causa
                        </label>
                        <select
                          value={reqCategory}
                          onChange={(e) => setReqCategory(e.target.value as OrganizationCategory)}
                          className="w-full h-11 sm:h-12 px-3 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white font-medium focus:border-stone-900 focus:outline-hidden cursor-pointer"
                        >
                          <option value="lar_idosos">Lar de Idosos</option>
                          <option value="orfanato">Acolhimento Infantojuvenil</option>
                          <option value="igreja">Igreja / Pastoral Social</option>
                          <option value="ong">ONG / Associação</option>
                          <option value="assistencia_social">Assistência Social Geral</option>
                        </select>
                      </div>

                      {/* Responsável: Nome e E-mail */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                            Nome do Responsável *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Seu nome completo"
                              value={reqResponsibleName}
                              onChange={(e) => setReqResponsibleName(e.target.value)}
                              className="w-full h-11 sm:h-12 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm focus:border-stone-900 focus:outline-hidden"
                              required
                            />
                            <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                            E-mail do Responsável *
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              placeholder="contato@email.org"
                              value={reqResponsibleEmail}
                              onChange={(e) => setReqResponsibleEmail(e.target.value)}
                              className="w-full h-11 sm:h-12 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm focus:border-stone-900 focus:outline-hidden"
                              required
                            />
                            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                          WhatsApp Oficial da Entidade *
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="(19) 99999-9999"
                            value={reqWhatsapp}
                            onChange={(e) => setReqWhatsapp(e.target.value)}
                            className="w-full h-11 sm:h-12 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm focus:border-stone-900 focus:outline-hidden"
                            required
                          />
                          <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Resumo da Ação */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                          Finalidade / Resumo das Atividades em Rio Claro
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Descreva brevemente o público atendido e ações desenvolvidas..."
                          value={reqPurpose}
                          onChange={(e) => setReqPurpose(e.target.value)}
                          className="w-full p-2.5 sm:p-3 rounded-xl border border-stone-300 bg-white text-sm focus:border-stone-900 focus:outline-hidden resize-none"
                        />
                      </div>

                      {/* Botão de Enviar Credenciamento */}
                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className="w-full h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-all cursor-pointer disabled:opacity-50 mt-1 shadow-xs"
                      >
                        {isSubmittingRequest ? 'Enviando...' : 'Enviar Solicitação de Credenciamento'}
                      </button>

                    </form>
                  )}
                </div>
              )}

            </div>
          ) : null}

        </div>
      </main>

      <SiteFooter />

    </div>
  );
}
