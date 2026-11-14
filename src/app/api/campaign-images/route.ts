import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });

  const auth = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('usuarios').select('papel, ativo, instituicao_id').eq('id', authData.user.id).maybeSingle();
  if (profile?.papel !== 'representante' || !profile.ativo || !profile.instituicao_id) return NextResponse.json({ error: 'Apenas representantes ativos podem enviar imagens.' }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Envie uma imagem JPG, PNG ou WebP de até 5 MB.' }, { status: 400 });
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from('campaign-images').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (uploadError) {
    console.error('Falha no upload da imagem da campanha:', uploadError.message);
    return NextResponse.json({ error: 'Não foi possível salvar a imagem.' }, { status: 500 });
  }
  const { data } = admin.storage.from('campaign-images').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
