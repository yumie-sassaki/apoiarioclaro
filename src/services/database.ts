import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Organization, Campaign, VerificationRequest, User, CadastralRequest } from '@/types';
import { 
  getStoredOrganizations, 
  setStoredOrganizations, 
  getStoredCampaigns, 
  setStoredCampaigns, 
  getStoredRequests, 
  setStoredRequests,
  getStoredLoggedInOrg,
  setStoredLoggedInOrg,
  getStoredLoggedInUser,
  setStoredLoggedInUser,
  getStoredUsers,
  setStoredUsers
} from '@/lib/storage';

// ==============================================================================
// Mappers: Banco Supabase (Português) <-> TypeScript Frontend (camelCase)
// ==============================================================================

function mapDbToOrganization(row: any): Organization {
  return {
    id: row.id,
    name: row.nome,
    category: row.categoria,
    categoryLabel: row.categoria_rotulo || row.nome,
    cnpj: row.cnpj || undefined,
    address: row.endereco,
    neighborhood: row.bairro,
    phone: row.telefone || '',
    whatsapp: row.whatsapp,
    pixKey: row.chave_pix || undefined,
    pixKeyType: row.tipo_chave_pix || undefined,
    pixBeneficiary: row.favorecido_pix || undefined,
    receiptMethods: Array.isArray(row.formas_recebimento) ? row.formas_recebimento : ['presencial'],
    description: row.descricao || '',
    verified: Boolean(row.verificada),
    status: row.status || 'aprovado',
    contactPerson: row.nome_responsavel || '',
    contactEmail: row.email_contato || '',
    foundedYear: row.ano_fundacao || undefined,
    bannerUrl: row.url_banner || undefined,
    logoUrl: row.url_logo || undefined,
    publicContactInfo: row.contatos_publicos || undefined
  };
}

function mapOrganizationToDb(org: Organization | Partial<Organization>): Record<string, any> {
  const dbRow: Record<string, any> = {};
  if (org.id !== undefined) dbRow.id = org.id;
  if (org.name !== undefined) dbRow.nome = org.name;
  if (org.category !== undefined) dbRow.categoria = org.category;
  if (org.categoryLabel !== undefined) dbRow.categoria_rotulo = org.categoryLabel;
  if (org.cnpj !== undefined) dbRow.cnpj = org.cnpj;
  if (org.address !== undefined) dbRow.endereco = org.address;
  if (org.neighborhood !== undefined) dbRow.bairro = org.neighborhood;
  if (org.phone !== undefined) dbRow.telefone = org.phone;
  if (org.whatsapp !== undefined) dbRow.whatsapp = org.whatsapp;
  if (org.pixKey !== undefined) dbRow.chave_pix = org.pixKey;
  if (org.pixKeyType !== undefined) dbRow.tipo_chave_pix = org.pixKeyType;
  if (org.pixBeneficiary !== undefined) dbRow.favorecido_pix = org.pixBeneficiary;
  if (org.receiptMethods !== undefined) dbRow.formas_recebimento = org.receiptMethods;
  if (org.description !== undefined) dbRow.descricao = org.description;
  if (org.verified !== undefined) dbRow.verificada = org.verified;
  if (org.status !== undefined) dbRow.status = org.status;
  if (org.contactPerson !== undefined) dbRow.nome_responsavel = org.contactPerson;
  if (org.contactEmail !== undefined) dbRow.email_contato = org.contactEmail;
  if (org.foundedYear !== undefined) dbRow.ano_fundacao = org.foundedYear;
  if (org.bannerUrl !== undefined) dbRow.url_banner = org.bannerUrl;
  if (org.logoUrl !== undefined) dbRow.url_logo = org.logoUrl;
  if (org.publicContactInfo !== undefined) dbRow.contatos_publicos = org.publicContactInfo || null;
  return dbRow;
}

function mapDbToCampaign(row: any): Campaign {
  return {
    id: row.id,
    organizationId: row.instituicao_id,
    organizationName: row.nome_instituicao,
    organizationVerified: Boolean(row.instituicao_verificada),
    title: row.titulo,
    description: row.descricao,
    category: row.categoria,
    categoryLabel: row.categoria_rotulo,
    urgency: row.urgencia || 'normal',
    startDate: row.data_inicio || undefined,
    deadlineDate: row.data_limite,
    location: row.local_entrega,
    saleLocations: Array.isArray(row.pontos_venda) ? row.pontos_venda : undefined,
    neighborhood: row.bairro,
    pixKey: row.chave_pix || undefined,
    pixBeneficiary: row.favorecido_pix || undefined,
    paymentMethod: row.forma_pagamento || undefined,
    paymentUrl: row.url_pagamento || undefined,
    ticketPrice: row.preco_adesao !== null && row.preco_adesao !== undefined ? Number(row.preco_adesao) : undefined,
    targetGoal: row.meta_arrecadacao || undefined,
    imageUrl: row.url_imagem,
    viewsCount: Number(row.visualizacoes) || 0,
    status: row.status || 'ativa',
    resultReport: row.prestacao_contas || undefined,
    createdAt: row.criado_em || new Date().toISOString()
  };
}

function mapCampaignToDb(camp: Campaign): Record<string, any> {
  return {
    id: camp.id,
    instituicao_id: camp.organizationId,
    nome_instituicao: camp.organizationName,
    instituicao_verificada: camp.organizationVerified,
    titulo: camp.title,
    descricao: camp.description,
    categoria: camp.category,
    categoria_rotulo: camp.categoryLabel,
    urgencia: camp.urgency,
    data_inicio: camp.startDate || null,
    data_limite: camp.deadlineDate,
    local_entrega: camp.location,
    pontos_venda: camp.saleLocations || [],
    bairro: camp.neighborhood || '',
    whatsapp_contato: '',
    chave_pix: camp.pixKey || null,
    favorecido_pix: camp.pixBeneficiary || null,
    forma_pagamento: camp.paymentMethod || null,
    url_pagamento: camp.paymentUrl || null,
    preco_adesao: camp.ticketPrice !== undefined ? camp.ticketPrice : null,
    meta_arrecadacao: camp.targetGoal || null,
    url_imagem: camp.imageUrl,
    visualizacoes: camp.viewsCount || 0,
    status: camp.status,
    prestacao_contas: camp.resultReport || null,
    criado_em: camp.createdAt
  };
}

function mapDbToVerificationRequest(row: any): VerificationRequest {
  return {
    id: row.id,
    orgName: row.nome_instituicao,
    category: row.categoria,
    cnpj: row.cnpj || '',
    responsibleName: row.nome_responsavel,
    responsibleRole: row.cargo_responsavel || '',
    phone: row.telefone || '',
    whatsapp: row.whatsapp,
    email: row.email || '',
    address: row.endereco || '',
    neighborhood: row.bairro || '',
    socialMediaOrWebsite: row.rede_social_ou_site || '',
    purpose: row.finalidade,
    status: row.status || 'pendente',
    requestedAt: row.solicitado_em || '',
    notes: row.observacoes || undefined
  };
}

function mapVerificationRequestToDb(req: VerificationRequest): Record<string, any> {
  return {
    id: req.id,
    nome_instituicao: req.orgName,
    categoria: req.category,
    cnpj: req.cnpj || null,
    nome_responsavel: req.responsibleName,
    cargo_responsavel: req.responsibleRole || null,
    telefone: req.phone || null,
    whatsapp: req.whatsapp,
    email: req.email || null,
    endereco: req.address || null,
    bairro: req.neighborhood || null,
    rede_social_ou_site: req.socialMediaOrWebsite || null,
    finalidade: req.purpose,
    status: req.status,
    // A interface antiga exibia "Hoje às 14:30"; o banco exige um timestamptz real.
    solicitado_em: Number.isNaN(Date.parse(req.requestedAt)) ? new Date().toISOString() : req.requestedAt,
    observacoes: req.notes || null
  };
}

function mapDbToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.nome,
    role: row.papel,
    organizationId: row.instituicao_id || null,
    phone: row.telefone || undefined,
    avatarUrl: row.avatar_url || undefined,
    active: Boolean(row.ativo),
    createdAt: row.criado_em
  };
}

function mapUserToDb(user: Partial<User>): Record<string, any> {
  const dbRow: Record<string, any> = {};
  if (user.id !== undefined) dbRow.id = user.id;
  if (user.email !== undefined) dbRow.email = user.email;
  if (user.name !== undefined) dbRow.nome = user.name;
  if (user.role !== undefined) dbRow.papel = user.role;
  if (user.organizationId !== undefined) dbRow.instituicao_id = user.organizationId;
  if (user.phone !== undefined) dbRow.telefone = user.phone;
  if (user.avatarUrl !== undefined) dbRow.avatar_url = user.avatarUrl;
  if (user.active !== undefined) dbRow.ativo = user.active;
  return dbRow;
}

// ==============================================================================
// Funções de Banco de Dados com Fallback Automático (Storage Local)
// ==============================================================================

export async function fetchOrganizations(): Promise<Organization[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('instituicoes')
        .select('*')
        .order('nome');
      
      if (!error && data) {
        const mapped = data.map(mapDbToOrganization);
        setStoredOrganizations(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase offline ou inacessível. Usando fallback local:', err);
    }
  }
  return getStoredOrganizations();
}

export async function updateOrganizationProfile(
  orgId: string, 
  updates: Partial<Organization>
): Promise<Organization | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = mapOrganizationToDb(updates);
      const { error } = await supabase
        .from('instituicoes')
        .update(dbRow)
        .eq('id', orgId);
      if (error) throw new Error(error.message);
    } catch (err) {
      console.warn('Erro ao atualizar instituição no Supabase:', err);
      throw err;
    }
  }

  const existingOrgs = getStoredOrganizations();
  let updatedOrg: Organization | null = null;
  const newOrgs = existingOrgs.map((org) => {
    if (org.id === orgId) {
      updatedOrg = { ...org, ...updates };
      return updatedOrg;
    }
    return org;
  });

  setStoredOrganizations(newOrgs);

  const logged = getStoredLoggedInOrg();
  if (logged && logged.id === orgId && updatedOrg) {
    setStoredLoggedInOrg(updatedOrg);
  }

  return updatedOrg;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .order('criado_em', { ascending: false });

      if (!error && data) {
        const mapped = data.map(mapDbToCampaign);
        setStoredCampaigns(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase offline ou inacessível para campanhas. Usando fallback local:', err);
    }
  }
  return getStoredCampaigns();
}

export async function createCampaignInDb(campaign: Campaign): Promise<Campaign> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = mapCampaignToDb(campaign);
      const { error } = await supabase.from('campanhas').insert(dbRow);
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.warn('Erro ao inserir campanha no Supabase:', err);
      throw err;
    }
  }

  const existing = getStoredCampaigns();
  const updated = [campaign, ...existing];
  setStoredCampaigns(updated);
  return campaign;
}

export async function updateCampaignInDb(campaign: Campaign): Promise<Campaign> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('campanhas')
      .update(mapCampaignToDb(campaign))
      .eq('id', campaign.id);
    if (error) throw new Error(error.message);
  }

  const updated = getStoredCampaigns().map((item) => item.id === campaign.id ? campaign : item);
  setStoredCampaigns(updated);
  return campaign;
}

export async function concludeCampaignWithReport(
  campaignId: string,
  report: NonNullable<Campaign['resultReport']>
): Promise<Campaign | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('campanhas')
        .update({
          status: 'concluida',
          prestacao_contas: report
        })
        .eq('id', campaignId);
    } catch (err) {
      console.warn('Erro ao concluir campanha no Supabase:', err);
    }
  }

  const existing = getStoredCampaigns();
  let updatedCamp: Campaign | null = null;
  const updatedList = existing.map((c) => {
    if (c.id === campaignId) {
      updatedCamp = {
        ...c,
        status: 'concluida',
        resultReport: report
      };
      return updatedCamp;
    }
    return c;
  });

  setStoredCampaigns(updatedList);
  return updatedCamp;
}

export async function deleteCampaignFromDb(campaignId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('campanhas')
        .delete()
        .eq('id', campaignId);
    } catch (err) {
      console.warn('Erro ao deletar campanha no Supabase:', err);
    }
  }

  const existing = getStoredCampaigns();
  const filtered = existing.filter((c) => c.id !== campaignId);
  setStoredCampaigns(filtered);
}

export async function incrementCampaignViewsInDb(campaignId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.rpc('incrementar_visualizacoes_campanha', { p_campanha_id: campaignId });
    } catch (err) {
      // Falha silenciosa no RPC, o storage local garante contagem
    }
  }

  const existing = getStoredCampaigns();
  const updated = existing.map((c) => 
    c.id === campaignId ? { ...c, viewsCount: (c.viewsCount || 0) + 1 } : c
  );
  setStoredCampaigns(updated);
}

export async function fetchVerificationRequests(): Promise<VerificationRequest[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_credenciamento')
        .select('*')
        .order('criado_em', { ascending: false });

      if (!error && data) {
        const mapped = data.map(mapDbToVerificationRequest);
        setStoredRequests(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase offline ou inacessível para solicitações. Usando fallback local:', err);
    }
  }
  return getStoredRequests();
}

export async function createVerificationRequestInDb(req: VerificationRequest): Promise<VerificationRequest> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = mapVerificationRequestToDb(req);
      const { error } = await supabase.from('solicitacoes_credenciamento').insert(dbRow);
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error('Erro ao enviar solicitação no Supabase:', err);
      throw err;
    }
  }

  const existing = getStoredRequests();
  const updated = [req, ...existing];
  setStoredRequests(updated);
  return req;
}

function mapDbToCadastralRequest(row: any): CadastralRequest {
  return {
    id: row.id,
    organizationId: row.instituicao_id,
    organizationName: row.instituicoes?.nome || 'Instituição',
    requestedBy: row.solicitante?.nome || 'Representante',
    requestedByEmail: row.solicitante?.email || '',
    type: row.tipo,
    details: row.detalhes,
    pixKeyType: row.tipo_chave_pix || undefined,
    pixBeneficiary: row.favorecido_pix || undefined,
    justification: row.justificativa,
    status: row.status,
    requestedAt: row.solicitado_em,
    reviewNotes: row.observacoes_revisao || undefined,
    scheduledFor: row.agendado_para || undefined
  };
}

export async function fetchCadastralRequests(): Promise<CadastralRequest[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('solicitacoes_cadastrais')
    .select('*, instituicoes(nome), solicitante:usuarios!solicitacoes_cadastrais_solicitado_por_fkey(nome, email)')
    .order('solicitado_em', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapDbToCadastralRequest);
}

export async function createCadastralRequestInDb(input: {
  type: CadastralRequest['type']; details: string; justification: string; pixKeyType?: CadastralRequest['pixKeyType']; pixBeneficiary?: string;
}): Promise<CadastralRequest> {
  if (!supabase) throw new Error('O Supabase precisa estar configurado para enviar a solicitação.');
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  const response = await fetch('/api/cadastral-requests', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(input)
  });
  const result = await response.json() as { error?: string; request?: CadastralRequest };
  if (!response.ok || !result.request) throw new Error(result.error || 'Não foi possível enviar a solicitação.');
  return result.request;
}

export async function reviewCadastralRequestInDb(requestId: string, decision: 'aprovar' | 'rejeitar'): Promise<void> {
  if (!supabase) throw new Error('O Supabase precisa estar configurado para revisar solicitações.');
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  const response = await fetch(`/api/cadastral-requests/${requestId}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ decision })
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || 'Não foi possível revisar a solicitação.');
}

export async function updateVerificationRequestStatusInDb(
  reqId: string, 
  status: 'aprovado' | 'rejeitado', 
  newOrg?: Organization
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('solicitacoes_credenciamento')
        .update({ status })
        .eq('id', reqId);

      if (status === 'aprovado' && newOrg) {
        const dbOrgRow = mapOrganizationToDb(newOrg);
        await supabase.from('instituicoes').insert(dbOrgRow);
      }
    } catch (err) {
      console.warn('Erro ao atualizar status de solicitação no Supabase:', err);
    }
  }

  const existingReqs = getStoredRequests();
  const updatedReqs = existingReqs.map((r) => r.id === reqId ? { ...r, status } : r);
  setStoredRequests(updatedReqs);

  if (status === 'aprovado' && newOrg) {
    const existingOrgs = getStoredOrganizations();
    const updatedOrgs = [newOrg, ...existingOrgs];
    setStoredOrganizations(updatedOrgs);
  }
}

// ==============================================================================
// Gestão de Usuários (Mestre e Representantes)
// ==============================================================================

export async function fetchUsers(): Promise<User[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      if (!error && data && data.length > 0) {
        return data.map(mapDbToUser);
      }
    } catch (err) {
      console.warn('Erro ao buscar usuários no Supabase:', err);
    }
  }

  return getStoredUsers();
}

export async function fetchUserByEmail(email: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        return mapDbToUser(data);
      }
    } catch (err) {
      console.warn('Erro ao buscar usuário por email no Supabase:', err);
    }
  }

  const users = getStoredUsers();
  return users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function fetchUserById(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapDbToUser(data);
}

export async function createUserInDb(user: User): Promise<User> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = mapUserToDb(user);
      await supabase.from('usuarios').insert(dbRow);
    } catch (err) {
      console.warn('Erro ao criar usuário no Supabase:', err);
    }
  }

  const existing = getStoredUsers();
  const updated = [user, ...existing];
  setStoredUsers(updated);
  return user;
}

export async function updateUserInDb(userId: string, updates: Partial<User>): Promise<User | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = mapUserToDb(updates);
      await supabase
        .from('usuarios')
        .update(dbRow)
        .eq('id', userId);
    } catch (err) {
      console.warn('Erro ao atualizar usuário no Supabase:', err);
    }
  }

  const existing = getStoredUsers();
  const idx = existing.findIndex((u) => u.id === userId);
  let updatedUser: User | null = null;
  if (idx !== -1) {
    updatedUser = { ...existing[idx], ...updates };
    existing[idx] = updatedUser;
    setStoredUsers([...existing]);
  }

  const loggedUser = getStoredLoggedInUser();
  if (loggedUser && loggedUser.id === userId) {
    const newLoggedUser = { ...loggedUser, ...updates };
    setStoredLoggedInUser(newLoggedUser);
    if (!updatedUser) updatedUser = newLoggedUser;
  }

  return updatedUser;
}

async function callAdminDeleteApi(payload: {
  userId?: string;
  organizationId?: string;
}): Promise<{ deletedUserIds: string[]; deletedOrganizationId: string | null }> {
  if (!supabase) {
    throw new Error('O Supabase precisa estar configurado para executar esta exclusão.');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  }

  const response = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json() as {
    error?: string;
    deletedUserIds?: string[];
    deletedOrganizationId?: string | null;
  };
  if (!response.ok) {
    throw new Error(result.error || 'Não foi possível concluir a exclusão.');
  }

  return {
    deletedUserIds: result.deletedUserIds || [],
    deletedOrganizationId: result.deletedOrganizationId || null
  };
}

export async function deleteUserFromDb(userId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await callAdminDeleteApi({ userId });
  }

  const existing = getStoredUsers();
  const filtered = existing.filter((u) => u.id !== userId);
  setStoredUsers(filtered);
}

export async function deleteOrganizationFromDb(
  organizationId: string
): Promise<{ deletedUserIds: string[] }> {
  let deletedUserIds: string[] = [];

  if (isSupabaseConfigured && supabase) {
    const result = await callAdminDeleteApi({ organizationId });
    deletedUserIds = result.deletedUserIds;
  }

  setStoredOrganizations(getStoredOrganizations().filter((org) => org.id !== organizationId));
  setStoredCampaigns(getStoredCampaigns().filter((camp) => camp.organizationId !== organizationId));
  setStoredUsers(
    getStoredUsers().filter((user) =>
      isSupabaseConfigured && supabase
        ? !deletedUserIds.includes(user.id)
        : user.organizationId !== organizationId
    )
  );

  return { deletedUserIds };
}

export async function approveVerificationRequestInDb(
  req: VerificationRequest
): Promise<{ org: Organization; user: User; reusedExistingAccount?: boolean }> {
  if (!supabase) {
    throw new Error('O Supabase precisa estar configurado para aprovar uma solicitação.');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  }

  const response = await fetch('/api/admin/approve-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(req)
  });
  const result = await response.json() as {
    error?: string;
    org?: Organization;
    user?: User;
    reusedExistingAccount?: boolean;
  };
  if (!response.ok || !result.org || !result.user) {
    throw new Error(result.error || 'Não foi possível aprovar a solicitação.');
  }

  return {
    org: result.org,
    user: result.user,
    reusedExistingAccount: Boolean(result.reusedExistingAccount)
  };
}

