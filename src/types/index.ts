export type OrganizationCategory = 
  | 'lar_idosos' 
  | 'orfanato' 
  | 'igreja' 
  | 'ong' 
  | 'assistencia_social';

export type CampaignCategory = 
  | 'alimentos' 
  | 'agasalho' 
  | 'adesao' 
  | 'cartinhas' 
  | 'financeiro' 
  | 'voluntariado';

export type PaymentMethod = 'presencial' | 'pix' | 'url';

export interface SaleLocation {
  address: string;
  neighborhood: string;
}

export interface Organization {
  id: string;
  name: string;
  category: OrganizationCategory;
  categoryLabel: string;
  cnpj?: string;
  address: string;
  neighborhood: string;
  phone: string;
  whatsapp: string;
  pixKey?: string;
  pixKeyType?: 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  pixBeneficiary?: string;
  receiptMethods?: Array<'presencial' | 'pix'>;
  description: string;
  verified: boolean;
  status: 'aprovado' | 'pendente' | 'rejeitado';
  contactPerson: string;
  contactEmail: string;
  foundedYear?: number;
  bannerUrl?: string;
  logoUrl?: string;
  /** Canais que a organização optou por exibir no mural público. */
  publicContactInfo?: string;
}

export interface Campaign {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationVerified: boolean;
  title: string;
  description: string;
  category: CampaignCategory;
  categoryLabel: string;
  urgency: 'alta' | 'media' | 'normal';
  deadlineDate: string; // YYYY-MM-DD
  location: string;
  saleLocations?: SaleLocation[];
  neighborhood: string;
  pixKey?: string;
  pixBeneficiary?: string;
  paymentMethod?: PaymentMethod;
  paymentUrl?: string;
  ticketPrice?: number; // Para adesões (ex: almoço beneficente, rifa)
  targetGoal?: {
    current: number;
    target: number;
    unit: string; // 'kg', 'peças', 'adesões', 'reais', 'cartinhas'
  };
  imageUrl: string;
  viewsCount?: number;
  status: 'ativa' | 'concluida';
  createdAt: string;
  resultReport?: {
    completedAt: string;
    goalStatus?: 'atingida' | 'superada' | 'parcial';
    achievedSummary: string;
    totalCollected: string;
    photoUrl?: string;
    photoUrls?: string[];
    receiptUrls?: string[];
    beneficiaries?: string;
    challenges?: string;
    testimonial?: string;
  };
}

export interface VerificationRequest {
  id: string;
  orgName: string;
  category: OrganizationCategory;
  cnpj: string;
  responsibleName: string;
  responsibleRole: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  neighborhood: string;
  socialMediaOrWebsite: string;
  purpose: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  requestedAt: string;
  notes?: string;
}

export type CadastralRequestType = 'pix' | 'sede' | 'razao' | 'outros' | 'encerramento';
export type CadastralRequestStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado' | 'concluido';

export interface CadastralRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  requestedBy: string;
  requestedByEmail: string;
  type: CadastralRequestType;
  details: string;
  pixKeyType?: Organization['pixKeyType'];
  pixBeneficiary?: string;
  justification: string;
  status: CadastralRequestStatus;
  requestedAt: string;
  reviewNotes?: string;
  scheduledFor?: string;
}

export type UserRole = 'mestre' | 'representante';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string | null;
  organizationName?: string | null;
  phone?: string;
  avatarUrl?: string;
  active: boolean;
  createdAt?: string;
}
