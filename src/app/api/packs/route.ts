import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (packsError) {
      return Response.json({ error: packsError.message }, { status: 500 });
    }

    // Fetch pack-card relations
    const { data: packCards, error: pcError } = await supabase
      .from('pack_cards')
      .select('pack_id, card_id');

    if (pcError) {
      return Response.json({ error: pcError.message }, { status: 500 });
    }

    // Attach card IDs to each pack
    const packsWithCards = (packs || []).map(pack => ({
      ...pack,
      cardIds: (packCards || [])
        .filter(pc => pc.pack_id === pack.id)
        .map(pc => pc.card_id),
    }));

    return Response.json({ packs: packsWithCards });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
