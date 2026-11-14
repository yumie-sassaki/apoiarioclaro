-- =============================================================================
-- Schema do Apoia Rio Claro (base limpa, sem dados de demonstração)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Escritas no bucket acontecem apenas pela rota de servidor após validar o representante.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('campaign-images', 'campaign-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('campaign-documents', 'campaign-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

-- O ID de cada organização é gerado pelo banco. O responsável autenticado fica
-- separado em usuario_auth_id, o UUID imutável fornecido pelo Supabase Auth.
CREATE TABLE IF NOT EXISTS public.instituicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  categoria_rotulo TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT NOT NULL,
  bairro TEXT NOT NULL,
  telefone TEXT,
  whatsapp TEXT NOT NULL,
  chave_pix TEXT,
  tipo_chave_pix TEXT,
  favorecido_pix TEXT,
  formas_recebimento JSONB NOT NULL DEFAULT '["presencial"]'::jsonb,
  descricao TEXT NOT NULL,
  verificada BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('aprovado', 'pendente', 'rejeitado', 'em_encerramento', 'encerrada')),
  encerramento_solicitado_em TIMESTAMPTZ,
  nome_responsavel TEXT NOT NULL,
  email_contato TEXT NOT NULL,
  contatos_publicos TEXT,
  ano_fundacao INTEGER,
  url_banner TEXT,
  url_logo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Perfil público da conta. Nunca armazena senha: ela pertence somente ao Auth.
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('mestre', 'representante')),
  instituicao_id UUID REFERENCES public.instituicoes(id) ON DELETE SET NULL,
  telefone TEXT,
  avatar_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID NOT NULL REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  nome_instituicao TEXT NOT NULL,
  instituicao_verificada BOOLEAN NOT NULL DEFAULT false,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  categoria_rotulo TEXT NOT NULL,
  urgencia TEXT NOT NULL DEFAULT 'normal',
  data_inicio DATE,
  data_limite DATE NOT NULL,
  local_entrega TEXT NOT NULL,
  pontos_venda JSONB NOT NULL DEFAULT '[]'::jsonb,
  bairro TEXT NOT NULL,
  chave_pix TEXT,
  favorecido_pix TEXT,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('presencial', 'pix', 'url')),
  url_pagamento TEXT,
  preco_adesao NUMERIC(10, 2),
  meta_arrecadacao JSONB,
  url_imagem TEXT NOT NULL,
  visualizacoes INTEGER NOT NULL DEFAULT 0 CHECK (visualizacoes >= 0),
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida')),
  prestacao_contas JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solicitacoes_credenciamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_instituicao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  cnpj TEXT,
  nome_responsavel TEXT NOT NULL,
  cargo_responsavel TEXT,
  telefone TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  endereco TEXT NOT NULL,
  bairro TEXT NOT NULL,
  rede_social_ou_site TEXT,
  finalidade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  solicitado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solicitacoes_cadastrais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID NOT NULL REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  solicitado_por UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pix', 'sede', 'razao', 'outros', 'encerramento')),
  detalhes TEXT NOT NULL,
  tipo_chave_pix TEXT CHECK (tipo_chave_pix IN ('cnpj', 'email', 'telefone', 'aleatoria')),
  favorecido_pix TEXT,
  justificativa TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado', 'concluido')),
  solicitado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  agendado_para TIMESTAMPTZ,
  revisado_em TIMESTAMPTZ,
  revisado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  observacoes_revisao TEXT
);

CREATE INDEX IF NOT EXISTS idx_campanhas_instituicao_id ON public.campanhas(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON public.campanhas(status);
CREATE INDEX IF NOT EXISTS idx_instituicoes_status ON public.instituicoes(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_instituicao_id ON public.usuarios(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cadastrais_status ON public.solicitacoes_cadastrais(status, solicitado_em DESC);

-- Função protegida usada somente pelas políticas. Não expõe uma API pública.
CREATE OR REPLACE FUNCTION private.is_mestre()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND papel = 'mestre' AND ativo = true
  );
$$;
REVOKE ALL ON FUNCTION private.is_mestre() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_mestre() TO authenticated;

-- Contador público: apenas campanhas visíveis podem ser incrementadas.
CREATE OR REPLACE FUNCTION public.incrementar_visualizacoes_campanha(p_campanha_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE total_visualizacoes INTEGER;
BEGIN
  UPDATE public.campanhas
  SET visualizacoes = visualizacoes + 1
  WHERE id = p_campanha_id AND status IN ('ativa', 'concluida')
  RETURNING visualizacoes INTO total_visualizacoes;
  RETURN total_visualizacoes;
END;
$$;
REVOKE ALL ON FUNCTION public.incrementar_visualizacoes_campanha(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.incrementar_visualizacoes_campanha(UUID) TO anon, authenticated;

ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_credenciamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_cadastrais ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.instituicoes, public.usuarios, public.campanhas, public.solicitacoes_credenciamento, public.solicitacoes_cadastrais FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.instituicoes, public.campanhas TO anon, authenticated;
GRANT INSERT ON public.solicitacoes_credenciamento TO anon, authenticated;
GRANT SELECT ON public.usuarios TO authenticated;
GRANT UPDATE ON public.instituicoes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campanhas TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.solicitacoes_credenciamento TO authenticated;
GRANT SELECT ON public.solicitacoes_cadastrais TO authenticated;

CREATE POLICY "Instituicoes publicas ou da propria conta"
  ON public.instituicoes FOR SELECT TO anon, authenticated
  USING (status = 'aprovado' OR usuario_auth_id = (select auth.uid()) OR (select private.is_mestre()));
CREATE POLICY "Representante ou mestre atualiza instituicao"
  ON public.instituicoes FOR UPDATE TO authenticated
  USING (usuario_auth_id = (select auth.uid()) OR (select private.is_mestre()))
  WITH CHECK (usuario_auth_id = (select auth.uid()) OR (select private.is_mestre()));

CREATE POLICY "Usuario consulta o proprio perfil ou mestre"
  ON public.usuarios FOR SELECT TO authenticated
  USING (id = (select auth.uid()) OR (select private.is_mestre()));

CREATE POLICY "Campanhas publicas ou da propria organizacao"
  ON public.campanhas FOR SELECT TO anon, authenticated
  USING (status IN ('ativa', 'concluida') OR (select private.is_mestre()) OR EXISTS (
    SELECT 1 FROM public.instituicoes
    WHERE instituicoes.id = campanhas.instituicao_id
      AND instituicoes.usuario_auth_id = (select auth.uid())
  ));
CREATE POLICY "Representante ou mestre cria campanha"
  ON public.campanhas FOR INSERT TO authenticated
  WITH CHECK ((select private.is_mestre()) OR EXISTS (
    SELECT 1 FROM public.instituicoes
    WHERE instituicoes.id = campanhas.instituicao_id
      AND instituicoes.usuario_auth_id = (select auth.uid())
  ));
CREATE POLICY "Representante ou mestre altera campanha"
  ON public.campanhas FOR UPDATE TO authenticated
  USING ((select private.is_mestre()) OR EXISTS (
    SELECT 1 FROM public.instituicoes
    WHERE instituicoes.id = campanhas.instituicao_id
      AND instituicoes.usuario_auth_id = (select auth.uid())
  ))
  WITH CHECK ((select private.is_mestre()) OR EXISTS (
    SELECT 1 FROM public.instituicoes
    WHERE instituicoes.id = campanhas.instituicao_id
      AND instituicoes.usuario_auth_id = (select auth.uid())
  ));
CREATE POLICY "Representante ou mestre exclui campanha"
  ON public.campanhas FOR DELETE TO authenticated
  USING ((select private.is_mestre()) OR EXISTS (
    SELECT 1 FROM public.instituicoes
    WHERE instituicoes.id = campanhas.instituicao_id
      AND instituicoes.usuario_auth_id = (select auth.uid())
  ));

CREATE POLICY "Visitante envia solicitacao pendente"
  ON public.solicitacoes_credenciamento FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pendente');
CREATE POLICY "Mestre gerencia solicitacoes"
  ON public.solicitacoes_credenciamento FOR ALL TO authenticated
  USING ((select private.is_mestre()))
  WITH CHECK ((select private.is_mestre()));

CREATE POLICY "Solicitante ou mestre consulta solicitacoes cadastrais"
  ON public.solicitacoes_cadastrais FOR SELECT TO authenticated
  USING (solicitado_por = (select auth.uid()) OR (select private.is_mestre()));

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE OR REPLACE FUNCTION private.finalizar_encerramentos_vencidos()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE organization_ids uuid[];
BEGIN
  SELECT array_agg(request.instituicao_id) INTO organization_ids
  FROM public.solicitacoes_cadastrais AS request
  WHERE request.tipo = 'encerramento' AND request.status = 'pendente' AND request.agendado_para <= now()
    AND NOT EXISTS (SELECT 1 FROM public.campanhas AS campaign WHERE campaign.instituicao_id = request.instituicao_id AND campaign.status = 'ativa');
  IF organization_ids IS NULL THEN RETURN; END IF;
  UPDATE public.instituicoes SET status = 'encerrada' WHERE id = ANY(organization_ids) AND status = 'em_encerramento';
  UPDATE public.usuarios SET ativo = false WHERE instituicao_id = ANY(organization_ids);
  UPDATE public.solicitacoes_cadastrais SET status = 'concluido', revisado_em = now()
    WHERE instituicao_id = ANY(organization_ids) AND tipo = 'encerramento' AND status = 'pendente';
END;
$$;
REVOKE ALL ON FUNCTION private.finalizar_encerramentos_vencidos() FROM PUBLIC;
SELECT cron.schedule('finalizar-encerramentos-instituicoes', '15 3 * * *', $$SELECT private.finalizar_encerramentos_vencidos();$$);
