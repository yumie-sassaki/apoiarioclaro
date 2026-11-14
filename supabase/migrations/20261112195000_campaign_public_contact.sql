-- O WhatsApp informado no credenciamento pertence ao representante e não deve
-- ser publicado automaticamente. Contatos passam a pertencer à organização.
ALTER TABLE public.campanhas
  DROP COLUMN IF EXISTS whatsapp_contato;

ALTER TABLE public.instituicoes
  ADD COLUMN IF NOT EXISTS contatos_publicos TEXT;

