import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type DeletePayload = {
  userId?: string;
  organizationId?: string;
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '');
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !publicUrl || !publicKey) {
    return errorResponse('Sessão inválida.', 401);
  }

  const authClient = createClient(publicUrl, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return errorResponse('Sessão inválida.', 401);
  }

  let body: DeletePayload;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Dados da exclusão inválidos.');
  }

  const userId = body.userId?.trim() || '';
  const organizationId = body.organizationId?.trim() || '';
  if (!userId && !organizationId) {
    return errorResponse('Informe o usuário ou a instituição a ser removida.');
  }

  const admin = getSupabaseAdmin();
  const { data: currentProfile } = await admin
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (currentProfile?.papel !== 'mestre' || !currentProfile.ativo) {
    return errorResponse('Apenas a administração pode remover instituições ou acessos.', 403);
  }

  const deletedUserIds: string[] = [];
  let deletedOrganizationId: string | null = null;

  if (organizationId) {
    const { data: org, error: orgFetchError } = await admin
      .from('instituicoes')
      .select('id, usuario_auth_id, email_contato')
      .eq('id', organizationId)
      .maybeSingle();

    if (orgFetchError || !org) {
      return errorResponse('Instituição não encontrada.', 404);
    }

    const { data: usersByOrg } = await admin
      .from('usuarios')
      .select('id, papel, instituicao_id')
      .eq('instituicao_id', organizationId);

    const candidateUserIds = new Set<string>((usersByOrg || []).map((u) => u.id));
    if (org.usuario_auth_id) {
      candidateUserIds.add(org.usuario_auth_id);
    }

    const { error: deleteOrgError } = await admin
      .from('instituicoes')
      .delete()
      .eq('id', organizationId);

    if (deleteOrgError) {
      console.error('Falha ao excluir instituição:', deleteOrgError.message);
      return errorResponse('Não foi possível excluir a instituição agora.', 500);
    }

    deletedOrganizationId = organizationId;

    for (const candidateId of candidateUserIds) {
      if (candidateId === authData.user.id) continue;

      const { data: candidateProfile } = await admin
        .from('usuarios')
        .select('id, papel, instituicao_id')
        .eq('id', candidateId)
        .maybeSingle();

      if (!candidateProfile || candidateProfile.papel === 'mestre') continue;
      if (candidateProfile.instituicao_id) continue;

      const { data: remainingOrgs } = await admin
        .from('instituicoes')
        .select('id')
        .eq('usuario_auth_id', candidateId)
        .limit(1);

      if (remainingOrgs && remainingOrgs.length > 0) continue;

      const { error: deleteProfileError } = await admin
        .from('usuarios')
        .delete()
        .eq('id', candidateId);

      if (!deleteProfileError) {
        const { error: deleteAuthError } = await admin.auth.admin.deleteUser(candidateId);
        if (deleteAuthError) {
          console.warn('Usuário removido do perfil, mas falhou ao remover do Auth:', deleteAuthError.message);
        }
        deletedUserIds.push(candidateId);
      }
    }

    return NextResponse.json({
      ok: true,
      deletedOrganizationId,
      deletedUserIds
    });
  }

  if (userId === authData.user.id) {
    return errorResponse('Você não pode excluir sua própria conta de Administrador Mestre em uso.');
  }

  const { data: targetUser, error: userFetchError } = await admin
    .from('usuarios')
    .select('id, papel, instituicao_id')
    .eq('id', userId)
    .maybeSingle();

  if (userFetchError || !targetUser) {
    return errorResponse('Usuário não encontrado.', 404);
  }

  if (targetUser.papel === 'mestre') {
    return errorResponse('Contas de Administrador Mestre não podem ser removidas por aqui.', 403);
  }

  await admin
    .from('instituicoes')
    .update({ usuario_auth_id: null })
    .eq('usuario_auth_id', userId);

  const { error: deleteProfileError } = await admin
    .from('usuarios')
    .delete()
    .eq('id', userId);

  if (deleteProfileError) {
    console.error('Falha ao excluir usuário:', deleteProfileError.message);
    return errorResponse('Não foi possível revogar o acesso do usuário.', 500);
  }

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
  if (deleteAuthError && !/not found/i.test(deleteAuthError.message)) {
    console.error('Falha ao excluir usuário no Supabase Auth:', deleteAuthError.message);
    return errorResponse('Perfil removido, mas houve uma falha ao remover a conta de autenticação.', 500);
  }

  deletedUserIds.push(userId);

  return NextResponse.json({
    ok: true,
    deletedOrganizationId,
    deletedUserIds
  });
}
