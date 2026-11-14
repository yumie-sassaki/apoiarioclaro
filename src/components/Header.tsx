'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { 
  Building2, 
  Layers, 
  User, 
  CheckCircle, 
  Info, 
  Plus
} from 'lucide-react';
import { Organization, User as UserType } from '@/types';

interface HeaderProps {
  activeTab: 'campanhas' | 'entidades' | 'resultados' | 'sobre';
  setActiveTab: (tab: 'campanhas' | 'entidades' | 'resultados' | 'sobre') => void;
  loggedInOrg: Organization | null;
  loggedInUser?: UserType | null;
  onOpenRepresentativeModal?: () => void;
  onOpenNewCampaign: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  loggedInOrg,
  loggedInUser,
  onOpenNewCampaign
}) => {
  return (
    <>
      {/* Barra Superior Enxuta (Desktop e Mobile) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Esquerda: Logo Apoia Rio Claro */}
            <Logo
              onClick={() => setActiveTab('campanhas')}
              iconSize={40}
              textSize="text-xl sm:text-2xl"
              priority
            />

            {/* Centro: As 4 abas (apenas desktop / md:flex) */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('campanhas')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'campanhas'
                    ? 'bg-[#0D4183] text-white'
                    : 'text-stone-600 hover:bg-[#EAF2FF] hover:text-[#0D4183]'
                }`}
              >
                Campanhas
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('entidades')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'entidades'
                    ? 'bg-[#0D4183] text-white'
                    : 'text-stone-600 hover:bg-[#EAF2FF] hover:text-[#0D4183]'
                }`}
              >
                Instituições
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('resultados')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'resultados'
                    ? 'bg-[#0D4183] text-white'
                    : 'text-stone-600 hover:bg-[#EAF2FF] hover:text-[#0D4183]'
                }`}
              >
                Resultados
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sobre')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'sobre'
                    ? 'bg-[#0D4183] text-white'
                    : 'text-stone-600 hover:bg-[#EAF2FF] hover:text-[#0D4183]'
                }`}
              >
                Como funciona
              </button>
            </nav>

            {/* Direita: Como Doar + Login Representante */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/como-contribuir"
                className="hidden sm:inline-flex items-center text-xs font-medium text-stone-600 hover:text-[#0D4183] transition-colors px-2 py-1"
              >
                Como doar
              </Link>

              {loggedInUser?.role === 'mestre' ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/painel"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#0D4183] hover:bg-[#08356D] transition-colors shadow-xs"
                    title="Painel do Administrador Mestre"
                  >
                    <span className="max-w-[110px] sm:max-w-[160px] truncate">Painel Mestre</span>
                  </Link>
                </div>
              ) : loggedInOrg ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/painel"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                    title="Acessar Painel da Entidade"
                  >
                    <Building2 className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                    <span className="max-w-[110px] sm:max-w-[150px] truncate">{loggedInOrg.name}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={onOpenNewCampaign}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-[#E04F33] hover:bg-[#C84127] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>Publicar</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 bg-[#EAF2FF] hover:bg-[#DCEBFF] text-[#0D4183] font-semibold text-xs px-3.5 py-2 rounded-full transition-colors whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5 text-[#0D4183] shrink-0" />
                  <span>Área da entidade</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Barra de Navegação Inferior Fixa Exclusiva para Celular (Mobile Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('campanhas')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors cursor-pointer ${
            activeTab === 'campanhas'
              ? 'text-[#0D4183] font-bold'
              : 'text-stone-400 font-medium hover:text-stone-700'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Campanhas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('entidades')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors cursor-pointer ${
            activeTab === 'entidades'
              ? 'text-[#0D4183] font-bold'
              : 'text-stone-400 font-medium hover:text-stone-700'
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Instituições</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resultados')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors cursor-pointer ${
            activeTab === 'resultados'
              ? 'text-[#0D4183] font-bold'
              : 'text-stone-400 font-medium hover:text-stone-700'
          }`}
        >
          <CheckCircle className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Resultados</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sobre')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors cursor-pointer ${
            activeTab === 'sobre'
              ? 'text-[#0D4183] font-bold'
              : 'text-stone-400 font-medium hover:text-stone-700'
          }`}
        >
          <Info className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Como funciona</span>
        </button>
      </nav>
    </>
  );
};
