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

// GET: list packs with their card associations
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id');
  if (!userId || !(await isAdmin(userId))) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data: packs, error: packsError } = await supabase
    .from('packs')
    .select('*')
    .order('created_at', { ascending: false });

  if (packsError) return Response.json({ error: packsError.message }, { status: 500 });

  const { data: packCards } = await supabase
    .from('pack_cards')
    .select('pack_id, card_id, drop_weight');

  return Response.json({ packs, packCards: packCards || [] });
}

// POST: create or update pack + card associations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pack, cardIds } = body;

    if (!userId || !(await isAdmin(userId))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!pack || !pack.name) {
      return Response.json({ error: 'name is required' }, { status: 400 });
    }

    const packData = {
      name: pack.name,
      description: pack.description || '',
      price: pack.price || 100,
      card_count: pack.card_count || 3,
      gradient: pack.gradient || null,
      emoji: pack.emoji || '📦',
      cover_url: pack.cover_url || null,
      is_active: pack.is_active !== false,
    };

    let packId: string;

    if (pack.id) {
      const { data, error } = await supabase
        .from('packs')
        .update(packData)
        .eq('id', pack.id)
        .select()
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      packId = data.id;
    } else {
      const { data, error } = await supabase
        .from('packs')
        .insert(packData)
        .select()
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      packId = data.id;
    }

    // Update card associations if provided
    if (cardIds && Array.isArray(cardIds)) {
      // Remove old associations
      await supabase
        .from('pack_cards')
        .delete()
        .eq('pack_id', packId);

      // Insert new ones
      if (cardIds.length > 0) {
        const insertData = cardIds.map((cardId: string) => ({
          pack_id: packId,
          card_id: cardId,
          drop_weight: 1,
        }));

        const { error: insertError } = await supabase
          .from('pack_cards')
          .insert(insertData);

        if (insertError) {
          return Response.json({ error: insertError.message }, { status: 500 });
        }
      }
    }

    return Response.json({ success: true, packId });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove a pack
export async function DELETE(request: NextRequest) {
  try {
    const { userId, packId } = await request.json();

    if (!userId || !(await isAdmin(userId))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // pack_cards will be auto-deleted via CASCADE
    const { error } = await supabase
      .from('packs')
      .delete()
      .eq('id', packId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

