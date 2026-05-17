import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Cancel a market listing (take card back)
export async function POST(request: NextRequest) {
  try {
    const { userId, listingId } = await request.json();

    if (!userId || !listingId) {
      return Response.json({ error: 'userId and listingId are required' }, { status: 400 });
    }

    // Get listing
    const { data: listing, error: listError } = await supabase
      .from('market_listings')
      .select('*')
      .eq('id', listingId)
      .eq('seller_id', userId)
      .single();

    if (listError || !listing) {
      return Response.json({ error: 'Listing not found or not yours' }, { status: 404 });
    }

    // Unmark card
    await supabase
      .from('user_cards')
      .update({ is_on_market: false })
      .eq('id', listing.user_card_id);

    // Remove listing
    await supabase
      .from('market_listings')
      .delete()
      .eq('id', listingId);

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
