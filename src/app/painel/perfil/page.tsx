'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import {
  ShieldCheck,
  Building2,
  User as UserIcon,
  Key,
  Lock,
  Camera,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartHandshake,
  Mail,
  Phone,
  Globe,
  MapPin,
  AlertCircle,
  X,
  FileCheck2
} from 'lucide-react';
import { User, Organization, OrganizationCategory } from '@/types';
import {
  getStoredLoggedInUser,
  setStoredLoggedInUser,
  getStoredLoggedInOrg,
  setStoredLoggedInOrg
} from '@/lib/storage';
import {
  createCadastralRequestInDb,
  fetchOrganizations,
  updateOrganizationProfile,
  updateUserInDb
} from '@/services/database';
import { supabase } from '@/lib/supabase';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { HelpSupportButton } from '@/components/HelpSupportButton';
import {
  formatCnpj,
  formatPhoneBR,
  isValidCnpj,
  isValidEmail,
  isValidPhoneBR,
  isValidUrl,
  parseOrganizationContacts
} from '@/lib/masks';

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const INSTITUTION_CATEGORIES: Array<{ value: OrganizationCategory; label: string }> = [
  { value: 'lar_idosos', label: 'Lar de Idosos' },
  { value: 'orfanato', label: 'Acolhimento Infantojuvenil' },
  { value: 'igreja', label: 'Igreja / Pastoral Social' },
  { value: 'ong', label: 'ONG / Associação' },
  { value: 'assistencia_social', label: 'Assistência Social Geral' }
];

function formatHeadquartersAddress(address?: string, neighborhood?: string): string {
  const cleanAddress = (address || '').trim();
  const cleanNeighborhood = (neighborhood || '').trim();
  if (!cleanAddress) {
    return cleanNeighborhood ? `${cleanNeighborhood}, Rio Claro - SP` : 'Rio Claro - SP';
  }
  const lower = cleanAddress.toLowerCase();
  const parts = [cleanAddress];
  if (cleanNeighborhood && !lower.includes(cleanNeighborhood.toLowerCase())) {
    parts.push(cleanNeighborhood);
  }
  if (!lower.includes('rio claro')) {
    parts.push('Rio Claro - SP');
  }
  return parts.join(' - ');
}

export default function PerfilPage() {
  const router = useRouter();

  // Navegação por 3 Abas Focadas
  const [activeTab, setActiveTab] = useState<'acesso' | 'instituicao' | 'doacoes'>('acesso');

  // Estados de sessão
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Formulário: Minha Conta de Acesso
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Feedbacks
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modal de Foto
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Preferências de Recebimento e Contatos Públicos
  const [receiptMethods, setReceiptMethods] = useState<Array<'presencial' | 'pix'>>(['presencial']);
  const [isSavingReceipts, setIsSavingReceipts] = useState(false);
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactWebsite, setContactWebsite] = useState('');
  const [isSavingPublicContact, setIsSavingPublicContact] = useState(false);

  // Apresentação Pública da Instituição
  const [orgDescription, setOrgDescription] = useState('');
  const [orgCategory, setOrgCategory] = useState<OrganizationCategory>('assistencia_social');
  const [isSavingPresentation, setIsSavingPresentation] = useState(false);

  // Modal de Solicitação de Alteração Cadastral
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changeJustification, setChangeJustification] = useState('');
  const [requestedInstitutionName, setRequestedInstitutionName] = useState('');
  const [requestedAddress, setRequestedAddress] = useState('');
  const [requestedOther, setRequestedOther] = useState('');
  const [pixKeyInput, setPixKeyInput] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cnpj' | 'email' | 'telefone' | 'aleatoria'>('cnpj');
  const [pixBeneficiary, setPixBeneficiary] = useState('');
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [isClosureConfirmationOpen, setIsClosureConfirmationOpen] = useState(false);
  const [changeRequestSuccess, setChangeRequestSuccess] = useState(false);
  const [changeRequestError, setChangeRequestError] = useState<string | null>(null);

  // Carregar dados da sessão
  useEffect(() => {
    const user = getStoredLoggedInUser();
    const org = getStoredLoggedInOrg();

    if (!user && !org) {
      router.push('/login');
      return;
    }

    setCurrentUser(user);
    setCurrentOrg(org);
    setOrgDescription(
      org?.description && org.description.trim() !== 'Solicitação de credenciamento enviada pela organização.'
        ? org.description
        : ''
    );
    setOrgCategory(org?.category || 'assistencia_social');
    setReceiptMethods(org?.receiptMethods?.length ? org.receiptMethods : ['presencial']);
    const parsedContacts = parseOrganizationContacts(org);
    setContactWhatsapp(parsedContacts.whatsapp);
    setContactInstagram(parsedContacts.instagram);
    setContactEmail(parsedContacts.email);
    setContactWebsite(parsedContacts.website);
    setPixKeyInput(org?.pixKey || '');
    setPixBeneficiary(org?.pixBeneficiary || '');
    setPixKeyType(org?.pixKeyType || 'cnpj');

    if (user) {
      setName(user.name || '');
      setPhone(formatPhoneBR(user.phone || ''));
      setAvatarUrl(user.avatarUrl || '');
    }

    if (!org && user?.organizationId) {
      fetchOrganizations().then((orgs) => {
        const found = orgs.find((o) => o.id === user.organizationId);
        if (found) {
          setCurrentOrg(found);
          setOrgDescription(
            found.description && found.description.trim() !== 'Solicitação de credenciamento enviada pela organização.'
              ? found.description
              : ''
          );
          setOrgCategory(found.category || 'assistencia_social');
          setReceiptMethods(found.receiptMethods?.length ? found.receiptMethods : ['presencial']);
          const parsedFound = parseOrganizationContacts(found);
          setContactWhatsapp(parsedFound.whatsapp);
          setContactInstagram(parsedFound.instagram);
          setContactEmail(parsedFound.email);
          setContactWebsite(parsedFound.website);
          setPixKeyInput(found.pixKey || '');
          setPixBeneficiary(found.pixBeneficiary || '');
          setPixKeyType(found.pixKeyType || 'cnpj');
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Logout
  const handleLogout = () => {
    void supabase?.auth.signOut();
    setStoredLoggedInUser(null);
    setStoredLoggedInOrg(null);
    router.push('/login');
  };

  // Salvar Alterações da Conta de Acesso
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(null);
    setSaveError(null);

    if (name.trim().split(/\s+/).filter(Boolean).length < 2) {
      setSaveError('Informe o nome completo do representante (pelo menos 2 palavras).');
      return;
    }

    if (phone.trim() && !isValidPhoneBR(phone)) {
      setSaveError('Informe um telefone ou WhatsApp válido com DDD, como (19) 99999-9999.');
      return;
    }

    if (newPassword.trim()) {
      if (!currentPassword) {
        setSaveError('Informe sua senha atual para definir uma nova senha.');
        return;
      }
      if (newPassword.length < 10) {
        setSaveError('A nova senha deve ter no mínimo 10 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setSaveError('A confirmação da nova senha não confere.');
        return;
      }
    }

    setIsSaving(true);

    try {
      if (newPassword.trim()) {
        if (!supabase) throw new Error('Autenticação indisponível.');
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
          current_password: currentPassword
        });
        if (error) throw error;
      }

      if (currentUser) {
        const updated = await updateUserInDb(currentUser.id, {
          name: name.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUrl.trim() || undefined
        });

        if (updated) {
          setCurrentUser(updated);
        }
      }

      setSaveSuccess(
        newPassword.trim()
          ? 'Dados pessoais e nova senha de acesso atualizados com sucesso.'
          : 'Dados pessoais atualizados com sucesso.'
      );
      setNewPassword('');
      setCurrentPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setSaveSuccess(null);
      }, 5000);
    } catch {
      setSaveError('Ocorreu um erro ao salvar as alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload de Imagem da Unidade
  const handleUploadPhoto = async () => {
    if (!selectedPhoto || !supabase) return;
    setIsUploadingPhoto(true);
    setSaveError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
      const formData = new FormData();
      formData.append('file', selectedPhoto);
      const response = await fetch('/api/profile-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'Não foi possível enviar a imagem.');
      
      setCurrentOrg((organization) => (organization ? { ...organization, logoUrl: result.url } : organization));
      if (currentOrg) {
        setStoredLoggedInOrg({ ...currentOrg, logoUrl: result.url });
      }
      setSelectedPhoto(null);
      setIsPhotoModalOpen(false);
      setSaveSuccess('Imagem da unidade atualizada.');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Remover Foto
  const handleRemovePhoto = async () => {
    setAvatarUrl('');
    if (currentOrg) {
      try {
        await updateOrganizationProfile(currentOrg.id, { logoUrl: '' });
        setCurrentOrg({ ...currentOrg, logoUrl: '' });
        setStoredLoggedInOrg({ ...currentOrg, logoUrl: '' });
        setSaveSuccess('Imagem da unidade removida.');
        setTimeout(() => setSaveSuccess(null), 5000);
      } catch (err) {
        console.error('Erro ao remover imagem:', err);
      }
    }
    setIsPhotoModalOpen(false);
  };

  // Alternar Forma de Recebimento
  const toggleReceiptMethod = (method: 'presencial' | 'pix') => {
    setReceiptMethods((methods) =>
      methods.includes(method) ? methods.filter((item) => item !== method) : [...methods, method]
    );
  };

  // Salvar Preferências de Doação
  const handleSaveReceiptMethods = async () => {
    if (!currentOrg || receiptMethods.length === 0) {
      setSaveError('Selecione pelo menos uma forma de recebimento.');
      return;
    }
    setIsSavingReceipts(true);
    setSaveError(null);
    try {
      if (receiptMethods.includes('pix') && !currentOrg.pixKey) {
        if (!pixKeyInput.trim() || !pixBeneficiary.trim()) {
          throw new Error('Informe a chave Pix e o nome ou razão social de quem receberá as doações.');
        }
        if (pixKeyType === 'cnpj' && !isValidCnpj(pixKeyInput)) {
          throw new Error('Informe um CNPJ válido com 14 dígitos para a chave Pix.');
        }
        if (pixKeyType === 'email' && !isValidEmail(pixKeyInput)) {
          throw new Error('Informe um e-mail válido para a chave Pix.');
        }
        if (pixKeyType === 'telefone' && !isValidPhoneBR(pixKeyInput)) {
          throw new Error('Informe um telefone válido com DDD para a chave Pix.');
        }
        if (pixKeyType === 'aleatoria' && pixKeyInput.trim().length < 20) {
          throw new Error('Informe uma chave Pix aleatória válida.');
        }
        if (pixBeneficiary.trim().split(/\s+/).filter(Boolean).length < 2) {
          throw new Error('Informe o nome completo ou razão social do titular da chave Pix.');
        }
      }
      const updated = await updateOrganizationProfile(currentOrg.id, { receiptMethods });
      if (updated) setCurrentOrg(updated);
      if (receiptMethods.includes('pix') && !currentOrg.pixKey) {
        await createCadastralRequestInDb({
          type: 'pix',
          details: pixKeyInput.trim(),
          pixKeyType,
          pixBeneficiary: pixBeneficiary.trim(),
          justification: 'Cadastro inicial da chave Pix para recebimento de doações.'
        });
      }
      setSaveSuccess('Preferências de recebimento atualizadas com sucesso.');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar as preferências.');
    } finally {
      setIsSavingReceipts(false);
    }
  };

  // Salvar Contatos Públicos
  const handleSavePublicContact = async () => {
    if (!currentOrg) return;
    setSaveError(null);

    if (contactWhatsapp.trim() && !isValidPhoneBR(contactWhatsapp)) {
      setSaveError('Informe um WhatsApp institucional válido com DDD, como (19) 99999-9999.');
      return;
    }

    const trimmedInsta = contactInstagram.trim();
    if (trimmedInsta && !/^@?[a-zA-Z0-9._]{2,30}$/.test(trimmedInsta) && !trimmedInsta.toLowerCase().includes('instagram.com')) {
      setSaveError('Informe um usuário do Instagram (ex.: @instituicao) ou link válido.');
      return;
    }

    if (contactEmail.trim() && !isValidEmail(contactEmail)) {
      setSaveError('Informe um e-mail de contato público válido.');
      return;
    }

    let normalizedWebsite = contactWebsite.trim();
    if (normalizedWebsite) {
      if (!/^https?:\/\//i.test(normalizedWebsite)) {
        normalizedWebsite = `https://${normalizedWebsite}`;
      }
      if (!isValidUrl(normalizedWebsite)) {
        setSaveError('Informe um endereço de site válido, como https://suaorganizacao.org.br.');
        return;
      }
    }

    setIsSavingPublicContact(true);
    try {
      const lines: string[] = [];
      if (contactWhatsapp.trim()) lines.push(`WhatsApp: ${formatPhoneBR(contactWhatsapp)}`);
      if (trimmedInsta) {
        const insta =
          trimmedInsta.startsWith('@') || trimmedInsta.startsWith('http')
            ? trimmedInsta
            : `@${trimmedInsta}`;
        lines.push(`Instagram: ${insta}`);
      }
      if (contactEmail.trim()) lines.push(`E-mail: ${contactEmail.trim()}`);
      if (normalizedWebsite) lines.push(`Site: ${normalizedWebsite}`);
      const formatted = lines.join('\n');

      const updated = await updateOrganizationProfile(currentOrg.id, {
        publicContactInfo: formatted
      });
      if (updated) {
        setCurrentOrg(updated);
        setStoredLoggedInOrg(updated);
      }
      if (normalizedWebsite !== contactWebsite) {
        setContactWebsite(normalizedWebsite);
      }
      setSaveSuccess('Canais públicos de contato atualizados com sucesso.');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar os contatos públicos.');
    } finally {
      setIsSavingPublicContact(false);
    }
  };

  // Salvar Apresentação Pública da Instituição
  const handleSaveInstitutionPresentation = async () => {
    if (!currentOrg) return;
    const trimmedDesc = orgDescription.trim();
    if (trimmedDesc.length < 10) {
      setSaveError('Informe uma breve apresentação da instituição (mínimo de 10 caracteres).');
      return;
    }
    setSaveError(null);
    setIsSavingPresentation(true);
    try {
      const matchedCategory = INSTITUTION_CATEGORIES.find((item) => item.value === orgCategory);
      const nextCategoryLabel = matchedCategory?.label || currentOrg.categoryLabel || 'Assistência Social Geral';
      const updates: Partial<Organization> = {
        description: trimmedDesc,
        category: orgCategory,
        categoryLabel: nextCategoryLabel
      };
      const updated = await updateOrganizationProfile(currentOrg.id, updates);
      const nextOrg = updated || { ...currentOrg, ...updates };
      setCurrentOrg(nextOrg);
      setStoredLoggedInOrg(nextOrg);
      setSaveSuccess('Apresentação pública da instituição atualizada com sucesso.');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Não foi possível salvar a apresentação da instituição.'
      );
    } finally {
      setIsSavingPresentation(false);
    }
  };

  // Enviar Solicitação de Alteração Cadastral
  const handleSubmitCadastralChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const changes = [
      requestedInstitutionName.trim() && { type: 'razao' as const, details: requestedInstitutionName.trim() },
      requestedAddress.trim() && { type: 'sede' as const, details: requestedAddress.trim() },
      requestedOther.trim() && { type: 'outros' as const, details: requestedOther.trim() }
    ].filter(Boolean) as Array<{ type: 'razao' | 'sede' | 'outros'; details: string }>;

    if (!changes.length || !changeJustification.trim()) {
      setChangeRequestError('Preencha ao menos um dado que deseja alterar e explique o motivo.');
      return;
    }

    setIsSubmittingChange(true);
    setChangeRequestError(null);

    try {
      await Promise.all(
        changes.map((change) =>
          createCadastralRequestInDb({ ...change, justification: changeJustification.trim() })
        )
      );
      setChangeRequestSuccess(true);
    } catch (error) {
      setChangeRequestError(error instanceof Error ? error.message : 'Não foi possível enviar a solicitação.');
    } finally {
      setIsSubmittingChange(false);
    }
  };

  const handleCloseChangeModal = () => {
    setIsChangeModalOpen(false);
    setChangeRequestSuccess(false);
    setChangeRequestError(null);
    setChangeJustification('');
    setRequestedInstitutionName('');
    setRequestedAddress('');
    setRequestedOther('');
  };

  // Solicitar Encerramento da Conta Institucional
  const handleRequestAccountClosure = async () => {
    setIsSubmittingChange(true);
    try {
      await createCadastralRequestInDb({
        type: 'encerramento',
        details: 'Encerramento solicitado pela própria organização.',
        justification: 'Solicitação de encerramento da conta institucional.'
      });
      await supabase?.auth.signOut();
      setStoredLoggedInUser(null);
      setStoredLoggedInOrg(null);
      router.replace('/login');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível solicitar o encerramento.');
    } finally {
      setIsSubmittingChange(false);
    }
  };

  // Obter iniciais do nome
  const getInitials = (n: string) => {
    if (!n) return 'RC';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (isLoading) {
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
        <p className="text-stone-600 text-sm font-semibold">Carregando dados cadastrais...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      {/* =========================================================
          CABEÇALHO SUPERIOR (PADRÃO /PAINEL)
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
              {currentOrg?.name || 'Painel da Entidade'}
            </span>
          </div>

          {/* Centro: Navegação principal da Entidade */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-full border border-stone-200/70">
            <Link
              href="/painel"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
            >
              Campanhas
            </Link>
            <Link
              href="/painel/perfil"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0D4183] text-white shadow-xs transition-colors"
            >
              Perfil e Dados
            </Link>
          </nav>

          {/* Ações da Direita */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/painel"
              className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Campanhas</span>
            </Link>

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
          CORPO PRINCIPAL (CONTAINER CENTRALIZADO E ELEGANTE MAX-W-3XL)
         ========================================================= */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-7 sm:py-10 space-y-6">
        {/* Título da Página */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display">
            Configurações e Perfil
          </h1>
          <p className="text-sm text-stone-600">
            Gerencie suas credenciais de acesso, dados institucionais homologados e canais de doação.
          </p>
        </div>

        {/* Barra de Abas em Pills */}
        <div className="flex items-center">
          <div className="bg-stone-100 p-1 rounded-2xl w-fit flex items-center gap-1.5 border border-stone-200/60 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('acesso')}
              className={`inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'acesso'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <span>Meu Acesso</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('instituicao')}
              className={`inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'instituicao'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <span>Dados da Instituição</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('doacoes')}
              className={`inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'doacoes'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 font-medium'
              }`}
            >
              <span>Canais e Doações</span>
            </button>
          </div>
        </div>

        {/* Feedbacks Globais */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-sm text-emerald-800 font-medium shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-800 font-medium shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* =========================================================
            CONTEÚDO DA ABA 1: MEU ACESSO
           ========================================================= */}
        {activeTab === 'acesso' && (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-7 shadow-xs space-y-6">
            {/* Cabeçalho do Card */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E04F33]/10 text-[#E04F33] flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                    Minha Conta de Acesso
                  </h2>
                  <p className="text-xs text-stone-500">Credenciais e contatos do responsável pelo acesso</p>
                </div>
              </div>
            </div>

            {/* Foto / Imagem da Unidade */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/70">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-white shadow-xs overflow-hidden bg-stone-800 flex items-center justify-center text-white font-bold text-lg font-display">
                  {currentOrg?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentOrg.logoUrl}
                      alt={`Imagem de ${currentOrg.name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(currentOrg?.name || name)}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-xs font-bold text-stone-700 block uppercase tracking-wider">
                  Foto da Unidade
                </span>
                <p className="text-xs text-stone-500 leading-tight">
                  Iniciais da instituição em fundo neutro se não houver foto cadastrada.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Alterar foto</span>
                  </button>

                  {currentOrg?.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs text-stone-500 hover:text-stone-800 underline transition-colors cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Formulário de Dados do Responsável */}
            <form onSubmit={handleSaveProfile} autoComplete="off" className="space-y-4">
              {/* Nome do Representante */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nome do Representante *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria Clara Souza"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* E-mail de Acesso (Somente Leitura) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    E-mail de Acesso
                  </label>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-600">
                    Login oficial
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    readOnly
                    value={currentUser?.email || ''}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-stone-200 text-sm bg-stone-100/80 text-stone-600 cursor-not-allowed font-mono"
                    title='Este campo é bloqueado para edição. Em caso de troca, solicite a alteração na aba "Dados da Instituição".'
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Este campo é bloqueado para edição. Em caso de troca, solicite a alteração na aba &quot;Dados da Instituição&quot;.
                </p>
              </div>

              {/* WhatsApp / Telefone de Contato */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  WhatsApp / Telefone de Contato
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    maxLength={15}
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                    placeholder="(19) 99876-5432"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Bloco Alterar Senha de Acesso */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-stone-600" />
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Alterar Senha de Acesso
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Deixe em branco se deseja manter a senha atual inalterada.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Senha atual (necessária para alterar)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        name="current-password-verification"
                        autoComplete="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Obrigatória ao trocar a senha"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="new-password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 10 dígitos"
                          className="w-full h-10 pl-9 pr-9 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                          title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Confirmar Nova Senha
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirm-new-password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-stone-300 text-xs sm:text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão Salvar Alterações */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-[#E04F33] hover:bg-[#C84127] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                >
                  <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================
            CONTEÚDO DA ABA 2: DADOS DA INSTITUIÇÃO
           ========================================================= */}
        {activeTab === 'instituicao' && (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-7 shadow-xs space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                    Dados Institucionais
                  </h2>
                  <p className="text-xs text-stone-500">Informações verificadas pela equipe do Apoia Rio Claro</p>
                </div>
              </div>
            </div>

            {/* Apresentação Pública no Mural */}
            <section className="space-y-4 pb-6 border-b border-stone-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Apresentação no Mural Público
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Essas informações aparecem no card da sua instituição na aba &quot;Instituições&quot; e podem ser atualizadas a qualquer momento.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Categoria / Causa Social
                  </label>
                  <select
                    value={orgCategory}
                    onChange={(e) => setOrgCategory(e.target.value as OrganizationCategory)}
                    className="w-full h-11 px-3.5 rounded-xl border border-stone-300 bg-white text-sm focus:border-stone-900 focus:outline-hidden cursor-pointer"
                  >
                    {INSTITUTION_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Descrição / Sobre a Instituição
                  </label>
                  <textarea
                    rows={3}
                    maxLength={600}
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    placeholder="Conte um pouco sobre a instituição, público atendido ou trabalho realizado em Rio Claro."
                    className="w-full p-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden bg-white resize-none"
                  />
                  <p className="mt-1 text-[11px] text-stone-500">
                    {orgDescription.length}/600 caracteres
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveInstitutionPresentation}
                    disabled={isSavingPresentation}
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{isSavingPresentation ? 'Salvando...' : 'Salvar apresentação'}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Selo de Segurança da Curadoria */}
            <div className="p-4 rounded-xl bg-[#FFF8F5] border border-[#F3DFD8] space-y-1">
              <span className="block text-xs font-bold text-stone-900 tracking-wide uppercase">
                Dados protegidos
              </span>
              <p className="text-xs text-stone-600 leading-relaxed">
                A alteração desses dados requer aprovação para prevenir a instituição e a população de Rio Claro de ataques e fraudes.
              </p>
            </div>

            {/* Grid 2x2 com cards de leitura compactos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Razão Social / Nome Oficial */}
              <div className="p-3.5 rounded-xl border border-stone-200/70 bg-stone-50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>Razão Social / Nome Oficial</span>
                </div>
                <p
                  className="text-sm font-bold text-stone-900 font-display truncate"
                  title={currentOrg?.name || currentUser?.organizationName || 'Instituição Não Identificada'}
                >
                  {currentOrg?.name || currentUser?.organizationName || 'Instituição Não Identificada'}
                </p>
              </div>

              {/* CNPJ Oficial */}
              <div className="p-3.5 rounded-xl border border-stone-200/70 bg-stone-50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <FileCheck2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>CNPJ Oficial</span>
                </div>
                <p className="text-sm font-semibold text-stone-800 font-mono">
                  {currentOrg?.cnpj || 'Não informado no credenciamento'}
                </p>
              </div>

              {/* Chave Pix Homologada */}
              <div className="p-3.5 rounded-xl border border-stone-200/70 bg-stone-50 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <Key className="w-3.5 h-3.5 text-stone-400" />
                  <span>{receiptMethods.includes('pix') ? 'Chave Pix Homologada' : 'Recebimento por Pix'}</span>
                </div>
                <p className="text-sm font-bold text-stone-900 font-mono break-all">
                  {receiptMethods.includes('pix')
                    ? currentOrg?.pixKey || 'Não cadastrada'
                    : 'Esta unidade recebe somente presencialmente.'}
                </p>
                {receiptMethods.includes('pix') && currentOrg?.pixBeneficiary && (
                  <p className="text-xs text-stone-600 mt-0.5">Titular: {currentOrg.pixBeneficiary}</p>
                )}
              </div>

              {/* Endereço da Sede em Rio Claro */}
              <div className="p-3.5 rounded-xl border border-stone-200/70 bg-stone-50 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>Endereço da Sede em Rio Claro</span>
                </div>
                <p
                  className="text-sm font-semibold text-stone-800 truncate"
                  title={formatHeadquartersAddress(currentOrg?.address, currentOrg?.neighborhood)}
                >
                  {formatHeadquartersAddress(currentOrg?.address, currentOrg?.neighborhood)}
                </p>
              </div>
            </div>

            {/* Botão Solicitar Alteração Cadastral */}
            <div className="pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsChangeModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-xs text-sm"
              >
                <span>Solicitar Alteração Cadastral</span>
              </button>
              <p className="text-xs text-stone-500 text-center mt-2">
                Avaliaremos a solicitação em até dois dias
              </p>
            </div>

            {/* Link sutil de encerramento da organização */}
            <div className="pt-4 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={() => setIsClosureConfirmationOpen(true)}
                disabled={isSubmittingChange}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 disabled:opacity-50 cursor-pointer transition-colors"
              >
                Solicitar encerramento da organização
              </button>
              <p className="text-[11px] text-stone-400 mt-1">
                Campanhas ativas impedem o encerramento. Após a solicitação, há 7 dias de segurança.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            CONTEÚDO DA ABA 3: CANAIS E DOAÇÕES
           ========================================================= */}
        {activeTab === 'doacoes' && (
          <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-7 shadow-xs space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-5 h-5 text-stone-800" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                    Canais Públicos e Preferências de Doação
                  </h2>
                  <p className="text-xs text-stone-500">Defina como o público pode entrar em contato com a Instituição que você representa</p>
                </div>
              </div>
            </div>

            {/* Bloco 1: Canais de Contato Públicos */}
            <section className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FFF8F5] border border-[#F3DFD8] space-y-1">
                <span className="block text-xs font-bold text-stone-900 tracking-wide uppercase">
                  Contato público para o mural
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Estas informações serão públicas e aparecerão no mural e nos detalhes das campanhas. Não inclua dados pessoais do representante se não quiser divulgá-los.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1) WhatsApp Institucional */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    WhatsApp Institucional
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      maxLength={15}
                      inputMode="tel"
                      value={contactWhatsapp}
                      onChange={(e) => setContactWhatsapp(formatPhoneBR(e.target.value))}
                      placeholder="(19) 99999-9999"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">Atendimento ao público e doadores</p>
                </div>

                {/* 2) Instagram Oficial */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Instagram Oficial
                  </label>
                  <div className="relative">
                    <InstagramIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={contactInstagram}
                      onChange={(e) => setContactInstagram(e.target.value)}
                      placeholder="@suaorganizacao ou link"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">Perfil ou link da página oficial</p>
                </div>

                {/* 3) E-mail de Contato Público */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    E-mail de Contato Público
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contato@organizacao.org.br"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">E-mail para informações e parcerias</p>
                </div>

                {/* 4) Site Oficial ou Rede Adicional */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Site Oficial ou Rede Adicional
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={contactWebsite}
                      onChange={(e) => setContactWebsite(e.target.value)}
                      placeholder="https://suaorganizacao.org.br"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden bg-white"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">Website ou canal web complementar</p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSavePublicContact}
                  disabled={isSavingPublicContact}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                >
                  <span>{isSavingPublicContact ? 'Salvando...' : 'Salvar canais públicos'}</span>
                </button>
              </div>
            </section>

            {/* Bloco 2: Como a unidade recebe doações */}
            <section className="pt-6 border-t border-stone-100 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Como a unidade recebe doações
                </span>
                <p className="text-xs text-stone-500 mt-0.5">
                  Defina como a sua unidade recebe as doações da comunidade de Rio Claro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    receiptMethods.includes('presencial')
                      ? 'border-[#E04F33] bg-[#E04F33]/5'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={receiptMethods.includes('presencial')}
                    onChange={() => toggleReceiptMethod('presencial')}
                    className="sr-only"
                  />
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      receiptMethods.includes('presencial')
                        ? 'bg-white text-[#E04F33] shadow-xs'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </span>
                  <div className="pr-4">
                    <strong className="block text-sm text-stone-900">No endereço</strong>
                    <span className="block text-xs text-stone-500 mt-0.5">Entrega direta na unidade</span>
                  </div>
                  {receiptMethods.includes('presencial') && (
                    <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#E04F33]" />
                  )}
                </label>

                <label
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    receiptMethods.includes('pix')
                      ? 'border-[#E04F33] bg-[#E04F33]/5'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={receiptMethods.includes('pix')}
                    onChange={() => toggleReceiptMethod('pix')}
                    className="sr-only"
                  />
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      receiptMethods.includes('pix')
                        ? 'bg-white text-[#E04F33] shadow-xs'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    <Key className="w-5 h-5" />
                  </span>
                  <div className="pr-4">
                    <strong className="block text-sm text-stone-900">Por Pix</strong>
                    <span className="block text-xs text-stone-500 mt-0.5">Chave revisada pela Curadoria</span>
                  </div>
                  {receiptMethods.includes('pix') && (
                    <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#E04F33]" />
                  )}
                </label>
              </div>

              {receiptMethods.includes('pix') && !currentOrg?.pixKey && (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Dados da chave Pix</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Essas informações serão enviadas para homologação ao salvar.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Tipo da chave</label>
                      <select
                        value={pixKeyType}
                        onChange={(event) => {
                          const nextType = event.target.value as typeof pixKeyType;
                          setPixKeyType(nextType);
                          if (nextType === 'cnpj') setPixKeyInput(formatCnpj(pixKeyInput));
                          else if (nextType === 'telefone') setPixKeyInput(formatPhoneBR(pixKeyInput));
                        }}
                        className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm focus:border-stone-900 focus:outline-hidden"
                      >
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="telefone">Telefone</option>
                        <option value="aleatoria">Aleatória</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-stone-700 mb-1">Chave Pix</label>
                      <input
                        value={pixKeyInput}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (pixKeyType === 'cnpj') setPixKeyInput(formatCnpj(value));
                          else if (pixKeyType === 'telefone') setPixKeyInput(formatPhoneBR(value));
                          else setPixKeyInput(value);
                        }}
                        maxLength={pixKeyType === 'cnpj' ? 18 : pixKeyType === 'telefone' ? 15 : 100}
                        inputMode={pixKeyType === 'cnpj' ? 'numeric' : pixKeyType === 'telefone' ? 'tel' : pixKeyType === 'email' ? 'email' : 'text'}
                        placeholder={
                          pixKeyType === 'cnpj'
                            ? '00.000.000/0001-00'
                            : pixKeyType === 'telefone'
                              ? '(19) 99999-9999'
                              : pixKeyType === 'email'
                                ? 'financeiro@organizacao.org.br'
                                : 'Digite a chave que receberá as doações'
                        }
                        className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm focus:border-stone-900 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Titular da chave</label>
                    <input
                      value={pixBeneficiary}
                      onChange={(event) => setPixBeneficiary(event.target.value)}
                      placeholder="Nome completo ou razão social de quem receberá"
                      className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm focus:border-stone-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveReceiptMethods}
                  disabled={isSavingReceipts}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#E04F33] hover:bg-[#C84127] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                >
                  <span>{isSavingReceipts ? 'Salvando...' : 'Salvar preferências de recebimento'}</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* =========================================================
          MODAL: SELEÇÃO / ALTERAÇÃO DE FOTO DE PERFIL
         ========================================================= */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-stone-700" />
                <h3 className="text-base font-bold text-stone-900 font-display">
                  Imagem da unidade
                </h3>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 rounded-xl bg-stone-50 border border-dashed border-stone-300 p-5 text-center">
              <Camera className="w-7 h-7 text-stone-500 mx-auto" />
              <div>
                <p className="text-sm font-bold text-stone-800">Envie uma foto do seu computador ou celular</p>
                <p className="text-xs text-stone-500 mt-1">JPG, PNG ou WebP, com até 2 MB.</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setSelectedPhoto(event.target.files?.[0] || null)}
                className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-lg file:border file:border-stone-300 file:bg-stone-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-stone-800 hover:file:bg-stone-200"
              />
              <button
                type="button"
                onClick={handleUploadPhoto}
                disabled={!selectedPhoto || isUploadingPhoto}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E04F33] hover:bg-[#C84127] disabled:opacity-40 cursor-pointer transition-colors shadow-xs"
              >
                {isUploadingPhoto ? 'Enviando imagem...' : 'Usar esta foto'}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              {currentOrg?.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Remover foto atual
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: SOLICITAR ALTERAÇÃO CADASTRAL
         ========================================================= */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-stone-800" />
                <h3 className="text-base font-bold text-stone-900 font-display">
                  Solicitação de Alteração Cadastral
                </h3>
              </div>
              <button
                onClick={handleCloseChangeModal}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changeRequestSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-stone-900 font-display">
                  Solicitação Enviada com Sucesso
                </h4>
                <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  Sua requisição foi encaminhada à Curadoria Mestre do Apoia Rio Claro. O protocolo
                  será analisado e os dados serão atualizados após a conferência documental.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseChangeModal}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-colors cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitCadastralChange} className="space-y-4">
                {changeRequestError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{changeRequestError}</span>
                  </div>
                )}
                <p className="text-xs text-stone-600 leading-relaxed">
                  Preencha todos os dados que deseja alterar. Cada campo preenchido segue para a Curadoria na mesma solicitação.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Novo nome ou razão social
                    </label>
                    <input
                      value={requestedInstitutionName}
                      onChange={(event) => setRequestedInstitutionName(event.target.value)}
                      placeholder="Preencha apenas se quiser alterar"
                      className="w-full h-11 px-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Novo endereço da sede
                    </label>
                    <input
                      value={requestedAddress}
                      onChange={(event) => setRequestedAddress(event.target.value)}
                      placeholder="Rua, número, bairro e CEP"
                      className="w-full h-11 px-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Outro dado cadastral
                    </label>
                    <input
                      value={requestedOther}
                      onChange={(event) => setRequestedOther(event.target.value)}
                      placeholder="Descreva outro dado que deseja corrigir"
                      className="w-full h-11 px-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Justificativa */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Justificativa / Motivo da Troca *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Ex: Mudança de domicílio bancário da conta corrente jurídica ou troca da sede administrativa."
                    value={changeJustification}
                    onChange={(e) => setChangeJustification(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseChangeModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingChange}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E04F33] hover:bg-[#C84127] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{isSubmittingChange ? 'Enviando...' : 'Enviar para Curadoria'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirmação de Encerramento */}
      <ConfirmationModal
        isOpen={isClosureConfirmationOpen}
        title="Encerrar organização?"
        description="A organização será retirada do mural agora. O encerramento definitivo será concluído após 7 dias de segurança."
        confirmLabel="Solicitar encerramento"
        isConfirming={isSubmittingChange}
        onCancel={() => setIsClosureConfirmationOpen(false)}
        onConfirm={() => {
          setIsClosureConfirmationOpen(false);
          void handleRequestAccountClosure();
        }}
      />
    </div>
  );
}
