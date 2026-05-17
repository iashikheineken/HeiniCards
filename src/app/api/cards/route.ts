import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('rank', { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ cards: data });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
