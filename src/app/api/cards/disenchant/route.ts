import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const DISENCHANT_VALUES: Record<string, number> = {
  S: 100,
  A: 50,
  B: 20,
  C: 5,
};

export async function POST(request: NextRequest) {
  try {
    const { userCardId, userId } = await request.json();

    if (!userCardId || !userId) {
      return Response.json({ error: 'userCardId and userId are required' }, { status: 400 });
    }

    // 1. Get the user_card entry
    const { data: userCard, error: ucError } = await supabase
      .from('user_cards')
      .select('*, cards(*)')
      .eq('id', userCardId)
      .eq('user_id', userId)
      .single();

    if (ucError || !userCard) {
      return Response.json({ error: 'Card not found in inventory' }, { status: 404 });
    }

    // 2. Check if card is on market
    if (userCard.is_on_market) {
      return Response.json({ error: 'Cannot disenchant a card listed on market' }, { status: 400 });
    }

    // 3. Calculate disenchant value
    const card = userCard.cards;
    const value = DISENCHANT_VALUES[card.rank] || 5;

    // 4. Get current user balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // 5. Delete the card from inventory
    const { error: deleteError } = await supabase
      .from('user_cards')
      .delete()
      .eq('id', userCardId);

    if (deleteError) {
      return Response.json({ error: 'Failed to disenchant card' }, { status: 500 });
    }

    // 6. Add coins to balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance + value })
      .eq('id', userId);

    if (balanceError) {
      return Response.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // 7. Update quest progress
    try {
      await fetch(new URL('/api/quests/progress', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'disenchant', amount: 1 }),
      });
    } catch (e) { /* non-critical */ }

    return Response.json({
      success: true,
      disenchantedCard: card.name,
      coinsReceived: value,
      newBalance: user.balance + value,
    });

  } catch (e) {
    console.error('Disenchant error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
