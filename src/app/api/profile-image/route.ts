import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });

  const authClient = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > maxBytes) {
    return NextResponse.json({ error: 'Envie uma imagem JPG, PNG ou WebP de até 2 MB.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('usuarios').select('id, ativo, instituicao_id').eq('id', authData.user.id).maybeSingle();
  if (!profile?.ativo || !profile.instituicao_id) return NextResponse.json({ error: 'Somente uma unidade ativa pode enviar sua imagem.' }, { status: 403 });

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from('profile-images').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (uploadError) return NextResponse.json({ error: 'Não foi possível salvar a imagem.' }, { status: 500 });

  const { data: publicUrl } = admin.storage.from('profile-images').getPublicUrl(path);
  const { error: profileError } = await admin.from('instituicoes').update({ url_logo: publicUrl.publicUrl }).eq('id', profile.instituicao_id);
  if (profileError) return NextResponse.json({ error: 'Imagem salva, mas não foi possível associá-la à unidade.' }, { status: 500 });
  return NextResponse.json({ url: publicUrl.publicUrl });
}
