import { Organization, Campaign, VerificationRequest, User } from '@/types';
import { INITIAL_CAMPAIGNS, INITIAL_ORGANIZATIONS, INITIAL_REQUESTS, INITIAL_USERS } from '@/data/mockData';

const LOGGED_ORG_KEY = 'apoia_rioclaro_logged_org';
const LOGGED_USER_KEY = 'apoia_rioclaro_logged_user';
const ORGANIZATIONS_KEY = 'apoia_rioclaro_organizations';
const CAMPAIGNS_KEY = 'apoia_rioclaro_campaigns';
const REQUESTS_KEY = 'apoia_rioclaro_requests';
const USERS_KEY = 'apoia_rioclaro_users';

export const getStoredLoggedInUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(LOGGED_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setStoredLoggedInUser = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOGGED_USER_KEY);
    }
    window.dispatchEvent(new Event('auth-change'));
  } catch (err) {
    console.error('Erro ao salvar usuário autenticado:', err);
  }
};

export const getStoredUsers = (): User[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) return INITIAL_USERS;
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_USERS;
    const filtered = (parsed as User[]).filter(
      (u) => u.id !== 'user-mestre' && u.id !== 'user-rep-1'
    );
    if (filtered.length !== parsed.length) {
      localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return INITIAL_USERS;
  }
};

export const setStoredUsers = (users: User[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Erro ao salvar usuários:', err);
  }
};

export const getStoredLoggedInOrg = (): Organization | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(LOGGED_ORG_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setStoredLoggedInOrg = (org: Organization | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (org) {
      localStorage.setItem(LOGGED_ORG_KEY, JSON.stringify(org));
    } else {
      localStorage.removeItem(LOGGED_ORG_KEY);
    }
    // Disparar evento para componentes ouvirem a alteração
    window.dispatchEvent(new Event('auth-change'));
  } catch (err) {
    console.error('Erro ao salvar organização autenticada:', err);
  }
};

export const getStoredOrganizations = (): Organization[] => {
  if (typeof window === 'undefined') return INITIAL_ORGANIZATIONS;
  try {
    const data = localStorage.getItem(ORGANIZATIONS_KEY);
    if (!data) return INITIAL_ORGANIZATIONS;
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_ORGANIZATIONS;
    const filtered = (parsed as Organization[]).filter((o) => o.id !== 'org-1');
    if (filtered.length !== parsed.length) {
      localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return INITIAL_ORGANIZATIONS;
  }
};

export const setStoredOrganizations = (orgs: Organization[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORGANIZATIONS_KEY, JSON.stringify(orgs));
  } catch (err) {
    console.error('Erro ao salvar organizações:', err);
  }
};

export const getStoredCampaigns = (): Campaign[] => {
  if (typeof window === 'undefined') return INITIAL_CAMPAIGNS;
  try {
    const data = localStorage.getItem(CAMPAIGNS_KEY);
    if (!data) return INITIAL_CAMPAIGNS;
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_CAMPAIGNS;
    const filtered = (parsed as Campaign[]).filter(
      (c) => c.id !== 'camp-1' && c.id !== 'camp-completed-1' && c.organizationId !== 'org-1'
    );
    if (filtered.length !== parsed.length) {
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return INITIAL_CAMPAIGNS;
  }
};

export const setStoredCampaigns = (campaigns: Campaign[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  } catch (err) {
    console.error('Erro ao salvar campanhas:', err);
  }
};

export const getStoredRequests = (): VerificationRequest[] => {
  if (typeof window === 'undefined') return INITIAL_REQUESTS;
  try {
    const data = localStorage.getItem(REQUESTS_KEY);
    if (!data) return INITIAL_REQUESTS;
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_REQUESTS;
    const filtered = (parsed as VerificationRequest[]).filter((r) => r.id !== 'req-1');
    if (filtered.length !== parsed.length) {
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return INITIAL_REQUESTS;
  }
};

export const setStoredRequests = (requests: VerificationRequest[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error('Erro ao salvar solicitações:', err);
  }
};

const HEARTED_CAMPAIGNS_KEY = 'apoia_rioclaro_hearted_campaigns';

export const getStoredHeartedCampaigns = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HEARTED_CAMPAIGNS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const toggleStoredHeartedCampaign = (campaignId: string): string[] => {
  const current = getStoredHeartedCampaigns();
  const next = current.includes(campaignId)
    ? current.filter((id) => id !== campaignId)
    : [...current, campaignId];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HEARTED_CAMPAIGNS_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Erro ao salvar curtidas de campanhas:', err);
    }
  }
  return next;
};
