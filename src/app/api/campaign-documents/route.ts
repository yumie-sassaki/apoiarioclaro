import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
  const auth = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data } = await auth.auth.getUser(token); if (!data.user) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
  const file = (await request.formData()).get('file');
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Envie PDF, JPG ou PNG de até 10 MB.' }, { status: 400 });
  const admin = getSupabaseAdmin(); const { data: profile } = await admin.from('usuarios').select('papel, ativo').eq('id', data.user.id).maybeSingle();
  if (profile?.papel !== 'representante' || !profile.ativo) return NextResponse.json({ error: 'Apenas representantes ativos podem enviar comprovantes.' }, { status: 403 });
  const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await admin.storage.from('campaign-documents').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) return NextResponse.json({ error: 'Não foi possível salvar o comprovante.' }, { status: 500 });
  const { data: publicData } = admin.storage.from('campaign-documents').getPublicUrl(path);
  return NextResponse.json({ url: publicData.publicUrl, path });
}
