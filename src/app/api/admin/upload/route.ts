import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('telegram_id, is_admin')
    .eq('id', userId)
    .single();
  return data?.is_admin === true || data?.telegram_id === ADMIN_TELEGRAM_ID;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const folder = formData.get('folder') as string || 'cards';

    if (!userId || !(await isAdmin(userId))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('heini-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('heini-assets')
      .getPublicUrl(data.path);

    return Response.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (e) {
    console.error('Upload error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
