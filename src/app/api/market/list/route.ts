import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// List a card on the market
export async function POST(request: NextRequest) {
  try {
    const { userId, userCardId, price } = await request.json();

    if (!userId || !userCardId || !price) {
      return Response.json({ error: 'userId, userCardId, and price are required' }, { status: 400 });
    }

    if (price < 1) {
      return Response.json({ error: 'Price must be positive' }, { status: 400 });
    }

    // Check ownership
    const { data: userCard, error: ucError } = await supabase
      .from('user_cards')
      .select('id, card_id, is_on_market')
      .eq('id', userCardId)
      .eq('user_id', userId)
      .single();

    if (ucError || !userCard) {
      return Response.json({ error: 'Card not found in inventory' }, { status: 404 });
    }

    if (userCard.is_on_market) {
      return Response.json({ error: 'Card is already on market' }, { status: 400 });
    }

    // Mark card as on market
    await supabase
      .from('user_cards')
      .update({ is_on_market: true })
      .eq('id', userCardId);

    // Create listing
    const { data: listing, error: listError } = await supabase
      .from('market_listings')
      .insert({
        seller_id: userId,
        user_card_id: userCardId,
        card_id: userCard.card_id,
        price,
      })
      .select()
      .single();

    if (listError) {
      // Rollback
      await supabase
        .from('user_cards')
        .update({ is_on_market: false })
        .eq('id', userCardId);
      return Response.json({ error: listError.message }, { status: 500 });
    }

    // Update quest progress
    try {
      await fetch(new URL('/api/quests/progress', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'sell_market', amount: 1 }),
      });
    } catch (e) { /* non-critical */ }

    return Response.json({ success: true, listing });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
