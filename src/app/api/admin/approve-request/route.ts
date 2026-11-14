import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const categoryLabels: Record<string, string> = {
  lar_idosos: 'Lar de Idosos',
  orfanato: 'Acolhimento Infantojuvenil',
  igreja: 'Igreja / Pastoral Social',
  ong: 'ONG / Associação',
  assistencia_social: 'Assistência Social Geral'
};

type ApprovalRequest = {
  id: string;
  orgName: string;
  category: string;
  cnpj?: string;
  responsibleName: string;
  responsibleRole?: string;
  phone?: string;
  whatsapp: string;
  email: string;
  address: string;
  neighborhood: string;
  purpose: string;
};

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '');
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !publicUrl || !publicKey) {
    return badRequest('Sessão inválida.', 401);
  }

  const authClient = createClient(publicUrl, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return badRequest('Sessão inválida.', 401);
  }

  let body: ApprovalRequest;
  try {
    body = await request.json();
  } catch {
    return badRequest('Dados da solicitação inválidos.');
  }

  const email = body.email?.trim().toLowerCase();
  if (!body.id || !body.orgName?.trim() || !body.responsibleName?.trim() || !email || !body.whatsapp?.trim() || !body.address?.trim() || !body.neighborhood?.trim() || !body.purpose?.trim() || !categoryLabels[body.category]) {
    return badRequest('A solicitação está incompleta e não pode ser aprovada.');
  }

  const admin = getSupabaseAdmin();
  const { data: currentProfile } = await admin
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (currentProfile?.papel !== 'mestre' || !currentProfile.ativo) {
    return badRequest('Apenas a administração pode aprovar solicitações.', 403);
  }

  // Reivindica a solicitação antes de criar o usuário. Assim, só uma chamada
  // concorrente pode enviar um convite para o mesmo e-mail.
  const { data: claimedRequest, error: claimError } = await admin
    .from('solicitacoes_credenciamento')
    .update({ status: 'aprovado' })
    .eq('id', body.id)
    .eq('status', 'pendente')
    .select('id')
    .maybeSingle();

  if (claimError || !claimedRequest) {
    return badRequest('Esta solicitação já está sendo processada ou não está mais pendente.', 409);
  }

  const releaseRequest = async () => {
    await admin
      .from('solicitacoes_credenciamento')
      .update({ status: 'pendente' })
      .eq('id', body.id)
      .eq('status', 'aprovado');
  };

  const { data: existingProfileByEmail } = await admin
    .from('usuarios')
    .select('id, email, nome, papel, instituicao_id, telefone, ativo')
    .eq('email', email)
    .maybeSingle();

  if (existingProfileByEmail?.papel === 'mestre') {
    await releaseRequest();
    return badRequest(
      'Este e-mail pertence à conta de Administração Mestre e não pode ser usado como representante.',
      409
    );
  }

  const origin = new URL(request.url).origin;
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name: body.responsibleName.trim() },
    redirectTo: `${origin}/primeiro-acesso`
  });

  let targetUserId: string;
  let reusedExistingAccount = false;
  let existingProfile = existingProfileByEmail;
  let previousLinkedOrgIds: string[] = [];

  if (inviteError || !inviteData.user) {
    let existingUserId = existingProfile?.id || null;

    if (!existingUserId) {
      const { data: usersPage, error: listUsersError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      if (!listUsersError && usersPage?.users) {
        const matchedAuthUser = usersPage.users.find((u) => u.email?.toLowerCase() === email);
        if (matchedAuthUser) {
          existingUserId = matchedAuthUser.id;
        }
      }
    }

    if (existingUserId) {
      if (!existingProfile || existingProfile.id !== existingUserId) {
        const { data: profileById } = await admin
          .from('usuarios')
          .select('id, email, nome, papel, instituicao_id, telefone, ativo')
          .eq('id', existingUserId)
          .maybeSingle();
        existingProfile = profileById;
      }

      if (existingProfile?.papel === 'mestre') {
        await releaseRequest();
        return badRequest(
          'Este e-mail pertence à conta de Administração Mestre e não pode ser usado como representante.',
          409
        );
      }

      reusedExistingAccount = true;
      targetUserId = existingUserId;

      const { data: linkedOrgs } = await admin
        .from('instituicoes')
        .select('id')
        .eq('usuario_auth_id', existingUserId);
      previousLinkedOrgIds = (linkedOrgs || []).map((row) => row.id);

      if (previousLinkedOrgIds.length > 0) {
        await admin
          .from('instituicoes')
          .update({ usuario_auth_id: null })
          .eq('usuario_auth_id', existingUserId);
      }

      await admin.auth.admin.updateUserById(existingUserId, {
        user_metadata: { name: body.responsibleName.trim() }
      });
    } else {
      await releaseRequest();
      console.error('Falha ao enviar convite de acesso:', inviteError?.message);
      const rawMessage = inviteError?.message || '';
      if (/rate\s*limit|too many/i.test(rawMessage)) {
        return badRequest(
          'Limite temporário de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.',
          429
        );
      }
      return badRequest(
        rawMessage
          ? `Não foi possível criar o acesso agora: ${rawMessage}`
          : 'Não foi possível criar o acesso agora. Atualize a página antes de tentar novamente.',
        409
      );
    }
  } else {
    targetUserId = inviteData.user.id;
  }

  const organizationId = crypto.randomUUID();
  const now = new Date().toISOString();
  const organizationPayload = {
    id: organizationId,
    usuario_auth_id: targetUserId,
    nome: body.orgName.trim(),
    categoria: body.category,
    categoria_rotulo: categoryLabels[body.category],
    cnpj: body.cnpj?.trim() || null,
    endereco: body.address.trim(),
    bairro: body.neighborhood.trim(),
    telefone: body.phone?.trim() || null,
    whatsapp: body.whatsapp.trim(),
    descricao: body.purpose.trim(),
    verificada: true,
    status: 'aprovado',
    nome_responsavel: body.responsibleName.trim(),
    email_contato: email
  };

  let organizationError: { message: string } | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { error } = await admin.from('instituicoes').insert(organizationPayload);
    if (!error) {
      organizationError = null;
      break;
    }
    organizationError = error;
    await wait(250 * (attempt + 1));
  }

  let profileError: { message: string } | null = organizationError;
  if (!organizationError) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { error } = await admin
        .from('usuarios')
        .upsert(
          {
            id: targetUserId,
            email,
            nome: body.responsibleName.trim(),
            papel: 'representante',
            instituicao_id: organizationId,
            telefone: body.phone?.trim() || body.whatsapp.trim(),
            ativo: true
          },
          { onConflict: 'id' }
        );
      if (!error) {
        profileError = null;
        break;
      }
      profileError = error;
      await wait(250 * (attempt + 1));
    }
  }

  const requestError = profileError;

  if (requestError) {
    console.error('Falha ao provisionar organização convidada:', requestError.message);
    await admin.from('instituicoes').delete().eq('id', organizationId);

    if (reusedExistingAccount) {
      if (previousLinkedOrgIds.length > 0) {
        await admin
          .from('instituicoes')
          .update({ usuario_auth_id: targetUserId })
          .eq('id', previousLinkedOrgIds[0]);
      }
      if (existingProfile) {
        await admin
          .from('usuarios')
          .update({
            nome: existingProfile.nome,
            instituicao_id: existingProfile.instituicao_id,
            telefone: existingProfile.telefone,
            ativo: existingProfile.ativo
          })
          .eq('id', targetUserId);
      }
    } else {
      await admin.from('usuarios').delete().eq('id', targetUserId);
      await admin.auth.admin.deleteUser(targetUserId);
    }

    await releaseRequest();
    return badRequest('Não foi possível concluir a aprovação. Nenhum acesso foi criado.', 500);
  }

  return NextResponse.json({
    reusedExistingAccount,
    org: {
      id: organizationId,
      name: body.orgName.trim(),
      category: body.category,
      categoryLabel: categoryLabels[body.category],
      cnpj: body.cnpj?.trim() || undefined,
      address: body.address.trim(),
      neighborhood: body.neighborhood.trim(),
      phone: body.phone?.trim() || body.whatsapp.trim(),
      whatsapp: body.whatsapp.trim(),
      description: body.purpose.trim(),
      verified: true,
      status: 'aprovado',
      contactPerson: body.responsibleName.trim(),
      contactEmail: email
    },
    user: {
      id: targetUserId,
      email,
      name: body.responsibleName.trim(),
      role: 'representante',
      organizationId,
      organizationName: body.orgName.trim(),
      phone: body.phone?.trim() || body.whatsapp.trim(),
      active: true,
      createdAt: now
    }
  });
}
