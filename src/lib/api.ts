import { supabase } from '@/lib/supabase';
import { cards as fakeCards, RANK_COLORS, RANK_LABELS } from '@/data/cards';
import type { Card, CardRank } from '@/data/cards';
import type { DbCard } from '@/lib/supabase';

/**
 * Convert a DB card to the frontend Card format
 */
export function dbCardToCard(db: DbCard): Card {
  return {
    id: db.id,
    name: db.name,
    rank: db.rank as CardRank,
    description: db.description || '',
    attack: db.attack,
    defense: db.defense,
    emoji: db.emoji || '🃏',
    gradient: db.gradient || 'linear-gradient(135deg, #1a1a28, #0a0a0f)',
    art_url: db.art_url || undefined,
    art_position: db.art_position || 'center',
  };
}

/**
 * Fetch all cards from Supabase, fallback to fake data
 */
export async function fetchCards(): Promise<Card[]> {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('rank', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No cards found');

    return data.map(dbCardToCard);
  } catch (e) {
    console.warn('Supabase cards fetch failed, using fake data:', e);
    return fakeCards;
  }
}

/**
 * Fetch packs with their cards from Supabase
 */
export async function fetchPacks() {
  try {
    // Fetch packs
    const { data: packsData, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (packsError) throw packsError;
    if (!packsData || packsData.length === 0) throw new Error('No packs found');

    // Fetch pack_cards relations
    const { data: packCardsData, error: pcError } = await supabase
      .from('pack_cards')
      .select('pack_id, card_id');

    if (pcError) throw pcError;

    // Fetch all cards
    const allCards = await fetchCards();
    const cardsMap = new Map(allCards.map(c => [c.id, c]));

    // Build packs with cards
    return packsData.map(pack => {
      const cardIds = (packCardsData || [])
        .filter(pc => pc.pack_id === pack.id)
        .map(pc => pc.card_id);

      const packCards = cardIds
        .map(id => cardsMap.get(id))
        .filter(Boolean) as Card[];

      return {
        id: pack.id,
        name: pack.name,
        description: pack.description || '',
        price: pack.price,
        cardCount: pack.card_count,
        gradient: pack.gradient || 'linear-gradient(135deg, #1a1a28, #0a0a0f)',
        emoji: pack.emoji || '📦',
        cards: packCards,
        cardIds,
      };
    });
  } catch (e) {
    console.warn('Supabase packs fetch failed, using fake data:', e);
    // Fallback to fake packs
    const { packs: fakePacks } = await import('@/data/packs');
    return fakePacks.map(p => ({
      ...p,
      cards: fakeCards.filter(c => p.cardIds.includes(c.id)),
    }));
  }
}

/**
 * Fetch or create user by telegram_id
 */
export async function fetchOrCreateUser(telegramId: number) {
  try {
    // Try to find existing user
    const { data: existing, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (existing && !findError) {
      return existing;
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        telegram_id: telegramId,
        username: `player_${telegramId}`,
        display_name: `Игрок ${telegramId}`,
        balance: 500,
        is_admin: false,
      })
      .select()
      .single();

    if (createError) throw createError;
    return newUser;
  } catch (e) {
    console.warn('User fetch/create failed:', e);
    return null;
  }
}

/**
 * Inventory card = Card + user_card row ID (for disenchant)
 */
export interface InventoryCard extends Card {
  userCardId: string;
  isOnMarket: boolean;
}

/**
 * Fetch user's inventory (owned cards with user_card IDs)
 */
export async function fetchUserInventory(userId: string): Promise<InventoryCard[]> {
  try {
    const { data, error } = await supabase
      .from('user_cards')
      .select('id, card_id, is_on_market, cards(*)')
      .eq('user_id', userId);

    if (error) throw error;
    if (!data) return [];

    return data
      .map((uc: Record<string, unknown>) => {
        const card = uc.cards as unknown as DbCard | null;
        if (!card) return null;
        return {
          ...dbCardToCard(card),
          userCardId: uc.id as string,
          isOnMarket: (uc.is_on_market as boolean) || false,
        };
      })
      .filter(Boolean) as InventoryCard[];
  } catch (e) {
    console.warn('Inventory fetch failed:', e);
    return [];
  }
}

/**
 * Disenchant values by rank
 */
export const DISENCHANT_VALUES: Record<string, number> = {
  S: 100,
  A: 50,
  B: 20,
  C: 5,
};

// Re-export for convenience
export { RANK_COLORS, RANK_LABELS };
export type { Card, CardRank };
