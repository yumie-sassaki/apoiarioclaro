ALTER TABLE public.instituicoes ADD COLUMN IF NOT EXISTS favorecido_pix TEXT;
ALTER TABLE public.solicitacoes_cadastrais ADD COLUMN IF NOT EXISTS favorecido_pix TEXT;
