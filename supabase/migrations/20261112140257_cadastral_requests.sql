-- Execute este arquivo uma vez no SQL Editor para atualizar uma base já existente.

ALTER TABLE public.instituicoes DROP CONSTRAINT IF EXISTS instituicoes_status_check;
ALTER TABLE public.instituicoes
  ADD CONSTRAINT instituicoes_status_check
  CHECK (status IN ('aprovado', 'pendente', 'rejeitado', 'em_encerramento', 'encerrada'));
ALTER TABLE public.instituicoes
  ADD COLUMN IF NOT EXISTS encerramento_solicitado_em TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.solicitacoes_cadastrais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id UUID NOT NULL REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  solicitado_por UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pix', 'sede', 'razao', 'outros', 'encerramento')),
  detalhes TEXT NOT NULL,
  tipo_chave_pix TEXT CHECK (tipo_chave_pix IN ('cnpj', 'email', 'telefone', 'aleatoria')),
  justificativa TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado', 'concluido')),
  solicitado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  agendado_para TIMESTAMPTZ,
  revisado_em TIMESTAMPTZ,
  revisado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  observacoes_revisao TEXT
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_cadastrais_status
  ON public.solicitacoes_cadastrais(status, solicitado_em DESC);

ALTER TABLE public.solicitacoes_cadastrais ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.solicitacoes_cadastrais FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.solicitacoes_cadastrais TO authenticated;

DROP POLICY IF EXISTS "Solicitante ou mestre consulta solicitacoes cadastrais" ON public.solicitacoes_cadastrais;
CREATE POLICY "Solicitante ou mestre consulta solicitacoes cadastrais"
  ON public.solicitacoes_cadastrais FOR SELECT TO authenticated
  USING (solicitado_por = (select auth.uid()) OR (select private.is_mestre()));
