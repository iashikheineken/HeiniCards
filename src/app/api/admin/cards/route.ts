import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');

/** Check if the user is admin by their user ID */
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('telegram_id, is_admin')
    .eq('id', userId)
    .single();

  return data?.is_admin === true || data?.telegram_id === ADMIN_TELEGRAM_ID;
}

// GET: list all cards (admin view)
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id');
  if (!userId || !(await isAdmin(userId))) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('rank', { ascending: true })
    .order('name', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ cards: data });
}

// POST: create or update a card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, card } = body;

    if (!userId || !(await isAdmin(userId))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!card || !card.name || !card.rank) {
      return Response.json({ error: 'name and rank are required' }, { status: 400 });
    }

    const cardData = {
      name: card.name,
      rank: card.rank,
      description: card.description || '',
      attack: card.attack || 0,
      defense: card.defense || 0,
      art_url: card.art_url || null,
      gradient: card.gradient || null,
      emoji: card.emoji || '🃏',
      art_position: card.art_position || 'center',
    };

    if (card.id) {
      // Update existing card
      const { data, error } = await supabase
        .from('cards')
        .update(cardData)
        .eq('id', card.id)
        .select()
        .single();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ card: data, action: 'updated' });
    } else {
      // Create new card
      const { data, error } = await supabase
        .from('cards')
        .insert(cardData)
        .select()
        .single();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ card: data, action: 'created' });
    }
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove a card
export async function DELETE(request: NextRequest) {
  try {
    const { userId, cardId } = await request.json();

    if (!userId || !(await isAdmin(userId))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
