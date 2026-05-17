import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: fetch all market listings with card + seller data
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('market_listings')
      .select('*, cards(*), users!market_listings_seller_id_fkey(id, username, display_name)')
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ listings: data || [] });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
