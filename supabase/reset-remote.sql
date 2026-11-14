-- ATENÇÃO: execute este arquivo uma única vez no SQL Editor do Supabase.
-- Ele apaga as tabelas públicas atuais e recria uma base vazia e segura.
-- Não apaga contas em auth.users.

BEGIN;

DROP FUNCTION IF EXISTS public.incrementar_visualizacoes_campanha(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.incrementar_visualizacoes_campanha(UUID) CASCADE;
DROP TABLE IF EXISTS public.solicitacoes_credenciamento CASCADE;
DROP TABLE IF EXISTS public.campanhas CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.instituicoes CASCADE;
DROP SCHEMA IF EXISTS private CASCADE;

COMMIT;

-- Em seguida, execute integralmente o conteúdo de supabase/schema.sql neste
-- mesmo editor. O schema não inclui dados de demonstração.
