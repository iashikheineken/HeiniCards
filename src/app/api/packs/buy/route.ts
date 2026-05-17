import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// Disenchant values by rank
const DISENCHANT_VALUES: Record<string, number> = {
  S: 100,
  A: 50,
  B: 20,
  C: 5,
};

export async function POST(request: NextRequest) {
  try {
    const { packId, userId } = await request.json();

    if (!packId || !userId) {
      return Response.json({ error: 'packId and userId are required' }, { status: 400 });
    }

    // 1. Get pack info
    const { data: pack, error: packError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (packError || !pack) {
      return Response.json({ error: 'Pack not found' }, { status: 404 });
    }

    // 2. Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Check balance
    if (user.balance < pack.price) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 4. Get pack cards with weights
    const { data: packCards, error: pcError } = await supabase
      .from('pack_cards')
      .select('card_id, drop_weight')
      .eq('pack_id', packId);

    if (pcError || !packCards || packCards.length === 0) {
      return Response.json({ error: 'Pack has no cards' }, { status: 400 });
    }

    // 5. Roll cards using weighted random
    const wonCardIds: string[] = [];
    for (let i = 0; i < pack.card_count; i++) {
      const totalWeight = packCards.reduce((sum, pc) => sum + pc.drop_weight, 0);
      let roll = Math.random() * totalWeight;

      for (const pc of packCards) {
        roll -= pc.drop_weight;
        if (roll <= 0) {
          wonCardIds.push(pc.card_id);
          break;
        }
      }
    }

    // 6. Deduct balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance - pack.price })
      .eq('id', userId);

    if (balanceError) {
      return Response.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    // 7. Add cards to user inventory
    const insertData = wonCardIds.map(cardId => ({
      user_id: userId,
      card_id: cardId,
    }));

    const { error: insertError } = await supabase
      .from('user_cards')
      .insert(insertData);

    if (insertError) {
      // Rollback balance
      await supabase
        .from('users')
        .update({ balance: user.balance })
        .eq('id', userId);
      return Response.json({ error: 'Failed to add cards' }, { status: 500 });
    }

    // 8. Get full card data for won cards
    const { data: wonCards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .in('id', wonCardIds);

    if (cardsError) {
      return Response.json({ error: 'Failed to fetch won cards' }, { status: 500 });
    }

    // Map wonCardIds to full card data (preserving order and duplicates)
    const cardsMap = new Map((wonCards || []).map(c => [c.id, c]));
    const orderedWonCards = wonCardIds.map(id => cardsMap.get(id)).filter(Boolean);

    return Response.json({
      success: true,
      wonCards: orderedWonCards,
      newBalance: user.balance - pack.price,
    });

  } catch (e) {
    console.error('Pack buy error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
