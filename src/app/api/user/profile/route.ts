import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const telegramId = request.nextUrl.searchParams.get('telegram_id');

  if (!telegramId) {
    return Response.json({ error: 'telegram_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', parseInt(telegramId))
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    return Response.json({ user: data });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
