CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION private.finalizar_encerramentos_vencidos()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  organization_ids uuid[];
BEGIN
  SELECT array_agg(request.instituicao_id) INTO organization_ids
  FROM public.solicitacoes_cadastrais AS request
  WHERE request.tipo = 'encerramento'
    AND request.status = 'pendente'
    AND request.agendado_para <= now()
    AND NOT EXISTS (
      SELECT 1 FROM public.campanhas AS campaign
      WHERE campaign.instituicao_id = request.instituicao_id
        AND campaign.status = 'ativa'
    );

  IF organization_ids IS NULL THEN RETURN; END IF;

  UPDATE public.instituicoes SET status = 'encerrada'
  WHERE id = ANY(organization_ids) AND status = 'em_encerramento';
  UPDATE public.usuarios SET ativo = false WHERE instituicao_id = ANY(organization_ids);
  UPDATE public.solicitacoes_cadastrais
  SET status = 'concluido', revisado_em = now()
  WHERE instituicao_id = ANY(organization_ids) AND tipo = 'encerramento' AND status = 'pendente';
END;
$$;

REVOKE ALL ON FUNCTION private.finalizar_encerramentos_vencidos() FROM PUBLIC;
SELECT cron.schedule('finalizar-encerramentos-instituicoes', '15 3 * * *', $$SELECT private.finalizar_encerramentos_vencidos();$$);
