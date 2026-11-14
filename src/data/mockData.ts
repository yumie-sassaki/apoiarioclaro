import { Organization, Campaign, VerificationRequest, User } from '@/types';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-1',
    name: 'Asilo São Vicente de Paulo',
    category: 'lar_idosos',
    categoryLabel: 'Lar de Idosos',
    cnpj: '56.398.112/0001-44',
    address: 'Rua 4, 1850',
    neighborhood: 'Centro',
    phone: '(19) 3524-1234',
    whatsapp: '19998765432',
    pixKey: '56398112000144',
    pixKeyType: 'cnpj',
    description: 'Acolhimento humanizado, moradia e assistência médica e recreativa para mais de 70 idosos em situação de vulnerabilidade em Rio Claro há mais de 80 anos.',
    verified: true,
    status: 'aprovado',
    contactPerson: 'Maria Helena (Coordenação)',
    contactEmail: 'contato@asilosaovicente-rc.org.br',
    foundedYear: 1942,
    bannerUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=200&q=80'
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    organizationId: 'org-1',
    organizationName: 'Asilo São Vicente de Paulo',
    organizationVerified: true,
    title: 'Adesões para a Tradicional Feijoada Beneficente',
    description: 'Estamos vendendo adesões para nossa 14ª Feijoada Solidária! O valor arrecadado será integralmente destinado à reforma do telhado da ala norte dos dormitórios dos idosos antes do período de chuvas fortes. Retire no formato drive-thru.',
    category: 'adesao',
    categoryLabel: 'Venda de Adesão / Evento',
    urgency: 'alta',
    deadlineDate: '2026-11-22',
    location: 'Retirada no Asilo: Rua 4, 1850 - Centro, Rio Claro',
    neighborhood: 'Centro',
    pixKey: '56398112000144',
    pixBeneficiary: 'Asilo São Vicente de Paulo - Rio Claro',
    ticketPrice: 45.0,
    targetGoal: {
      current: 180,
      target: 300,
      unit: 'adesões'
    },
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    viewsCount: 184,
    status: 'ativa',
    createdAt: '2026-11-01'
  },
  // Campanha concluída com prestação de contas:
  {
    id: 'camp-completed-1',
    organizationId: 'org-1',
    organizationName: 'Asilo São Vicente de Paulo',
    organizationVerified: true,
    title: 'Campanha de Fraldas Geriátricas G e EG',
    description: 'Campanha especial para renovar o estoque trimestral de fraldas dos 70 residentes do asilo.',
    category: 'alimentos',
    categoryLabel: 'Higiene e Fraldas',
    urgency: 'normal',
    deadlineDate: '2026-10-15',
    location: 'Rua 4, 1850 - Centro',
    neighborhood: 'Centro',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    status: 'concluida',
    createdAt: '2026-09-15',
    resultReport: {
      completedAt: '2026-10-18',
      achievedSummary: 'Meta superada com a solidariedade da população de Rio Claro! Conseguimos suprir 4 meses de consumo de fraldas para todos os nossos idosos.',
      totalCollected: '3.420 pacotes de fraldas e R$ 2.850 via Pix',
      photoUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
      testimonial: '"Agradecemos de coração a cada morador de Rio Claro e empresas parceiras. A transparência e o apoio de vocês mantêm nossa casa viva e acolhedora."'
    }
  }
];

export const INITIAL_REQUESTS: VerificationRequest[] = [
  {
    id: 'req-1',
    orgName: 'Associação de Pais e Amigos dos Excepcionais (APAE Rio Claro)',
    category: 'assistencia_social',
    cnpj: '44.821.903/0001-85',
    responsibleName: 'Luciana Ferreira',
    responsibleRole: 'Diretora Administrativa',
    phone: '(19) 3522-7700',
    whatsapp: '19996554433',
    email: 'luciana@apaerioclaro.org.br',
    address: 'Rua 10, 2450',
    neighborhood: 'Santana',
    socialMediaOrWebsite: 'instagram.com/apaerioclaro',
    purpose: 'Desejamos divulgar nossa Feira da Primavera beneficente e campanhas de apadrinhamento pedagógico.',
    status: 'pendente',
    requestedAt: '2026-11-07 10:15'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-mestre',
    email: 'admin@apoiarioclaro.com.br',
    name: 'Administrador Mestre (Curadoria)',
    role: 'mestre',
    organizationId: null,
    organizationName: 'Gestão Geral Apoia Rio Claro',
    phone: '(19) 99999-0000',
    active: true
  },
  {
    id: 'user-rep-1',
    email: 'contato@asilosaovicente-rc.org.br',
    name: 'Maria Helena',
    role: 'representante',
    organizationId: 'org-1',
    organizationName: 'Asilo São Vicente de Paulo',
    phone: '19998765432',
    active: true
  }
];
