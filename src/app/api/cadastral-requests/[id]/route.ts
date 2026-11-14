import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function responseError(error: string, status = 400) { return NextResponse.json({ error }, { status }); }

async function authenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

export async function PATCH(request: NextRequest, context: RouteContext<'/api/cadastral-requests/[id]'>) {
  const user = await authenticatedUser(request);
  if (!user) return responseError('Sessão inválida.', 401);
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { decision?: string } | null;
  if (!body || !['aprovar', 'rejeitar'].includes(body.decision || '')) return responseError('Decisão inválida.');

  const admin = getSupabaseAdmin();
  const { data: reviewer } = await admin.from('usuarios').select('papel, ativo').eq('id', user.id).maybeSingle();
  if (reviewer?.papel !== 'mestre' || !reviewer.ativo) return responseError('Apenas a Curadoria Mestre pode revisar solicitações.', 403);
  const { data: change } = await admin.from('solicitacoes_cadastrais').select('*').eq('id', id).eq('status', 'pendente').maybeSingle();
  if (!change) return responseError('Esta solicitação não está mais pendente.', 409);

  if (change.tipo === 'encerramento') {
    if (body.decision === 'aprovar') return responseError('O encerramento será concluído automaticamente após os 7 dias de segurança.');
    await admin.from('instituicoes').update({ status: 'aprovado', encerramento_solicitado_em: null }).eq('id', change.instituicao_id);
  } else if (body.decision === 'aprovar') {
    const update: Record<string, string | null> = {};
    if (change.tipo === 'pix') { update.chave_pix = change.detalhes; update.tipo_chave_pix = change.tipo_chave_pix; update.favorecido_pix = change.favorecido_pix; }
    if (change.tipo === 'sede') update.endereco = change.detalhes;
    if (change.tipo === 'razao') update.nome = change.detalhes;
    if (Object.keys(update).length > 0) {
      const { error } = await admin.from('instituicoes').update(update).eq('id', change.instituicao_id);
      if (error) return responseError('Não foi possível aplicar a alteração aprovada.', 500);
    }
  }
  const status = body.decision === 'aprovar' ? 'aprovado' : 'rejeitado';
  const { error } = await admin.from('solicitacoes_cadastrais').update({ status, revisado_em: new Date().toISOString(), revisado_por: user.id }).eq('id', id);
  if (error) return responseError('Não foi possível registrar a decisão.', 500);
  return NextResponse.json({ ok: true });
}
