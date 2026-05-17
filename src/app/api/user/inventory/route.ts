import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id');

  if (!userId) {
    return Response.json({ error: 'user_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('user_cards')
      .select('id, card_id, obtained_at, is_on_market, cards(*)')
      .eq('user_id', userId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ inventory: data });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
