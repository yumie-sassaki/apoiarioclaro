import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const requestTypes = ['pix', 'sede', 'razao', 'outros', 'encerramento'] as const;
const pixKeyTypes = ['cnpj', 'email', 'telefone', 'aleatoria'] as const;

function responseError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

async function authenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser(request);
  if (!user) return responseError('Sessão inválida.', 401);

  let body: { type?: string; details?: string; justification?: string; pixKeyType?: string; pixBeneficiary?: string };
  try { body = await request.json(); } catch { return responseError('Dados inválidos.'); }
  if (!body.type || !requestTypes.includes(body.type as typeof requestTypes[number]) || !body.details?.trim() || !body.justification?.trim()) {
    return responseError('Preencha todos os dados da solicitação.');
  }
  if (body.type === 'pix' && !pixKeyTypes.includes(body.pixKeyType as typeof pixKeyTypes[number])) {
    return responseError('Selecione o tipo da chave Pix.');
  }
  if (body.type === 'pix' && !body.pixBeneficiary?.trim()) return responseError('Informe o nome ou razão social do titular da chave Pix.');

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('usuarios')
    .select('id, nome, email, papel, instituicao_id, ativo')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.ativo || profile.papel !== 'representante' || !profile.instituicao_id) {
    return responseError('Somente o representante ativo da organização pode enviar esta solicitação.', 403);
  }

  const { data: existing } = await admin
    .from('solicitacoes_cadastrais')
    .select('id')
    .eq('instituicao_id', profile.instituicao_id)
    .eq('tipo', body.type)
    .eq('status', 'pendente')
    .maybeSingle();
  if (existing) return responseError('Já existe uma solicitação pendente deste tipo.', 409);

  let scheduledFor: string | null = null;
  if (body.type === 'encerramento') {
    const { count } = await admin
      .from('campanhas')
      .select('*', { count: 'exact', head: true })
      .eq('instituicao_id', profile.instituicao_id)
      .eq('status', 'ativa');
    if ((count || 0) > 0) return responseError('Conclua ou exclua as campanhas ativas antes de solicitar o encerramento.', 409);
    scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: organizationError } = await admin.from('instituicoes').update({
      status: 'em_encerramento', encerramento_solicitado_em: new Date().toISOString()
    }).eq('id', profile.instituicao_id);
    if (organizationError) return responseError('Não foi possível iniciar o encerramento.', 500);
  }

  const { data, error } = await admin.from('solicitacoes_cadastrais').insert({
    instituicao_id: profile.instituicao_id,
    solicitado_por: profile.id,
    tipo: body.type,
    detalhes: body.details.trim(),
    tipo_chave_pix: body.type === 'pix' ? body.pixKeyType : null,
    favorecido_pix: body.type === 'pix' ? body.pixBeneficiary?.trim() : null,
    justificativa: body.justification.trim(),
    agendado_para: scheduledFor
  }).select('*').single();
  if (error || !data) return responseError('Não foi possível registrar a solicitação.', 500);

  const { data: organization } = await admin.from('instituicoes').select('nome').eq('id', profile.instituicao_id).single();
  return NextResponse.json({ request: {
    id: data.id, organizationId: profile.instituicao_id, organizationName: organization?.nome || 'Instituição',
    requestedBy: profile.nome, requestedByEmail: profile.email, type: data.tipo, details: data.detalhes,
    pixKeyType: data.tipo_chave_pix || undefined, pixBeneficiary: data.favorecido_pix || undefined, justification: data.justificativa, status: data.status,
    requestedAt: data.solicitado_em, scheduledFor: data.agendado_para || undefined
  } });
}
