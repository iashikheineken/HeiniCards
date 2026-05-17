import { supabase } from '@/lib/supabase';

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const telegramId = parseInt(searchParams.get('telegram_id') || '0');

  if (telegramId !== ADMIN_TELEGRAM_ID) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Active today (users who logged in today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: activeToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_daily_reward', today.toISOString());

    // Total cards in circulation
    const { count: totalCards } = await supabase
      .from('user_cards')
      .select('*', { count: 'exact', head: true });

    // Total market listings
    const { count: activeListings } = await supabase
      .from('market_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Total unique card types
    const { count: cardTypes } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true });

    // Total packs
    const { count: packTypes } = await supabase
      .from('packs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Top 10 richest users
    const { data: richest } = await supabase
      .from('users')
      .select('display_name, username, balance')
      .order('balance', { ascending: false })
      .limit(10);

    // Top collectors (most cards)
    const { data: topCollectors } = await supabase
      .from('user_cards')
      .select('user_id')
      .then(async (result) => {
        if (!result.data) return { data: [] };
        const counts: Record<string, number> = {};
        result.data.forEach((row: { user_id: string }) => {
          counts[row.user_id] = (counts[row.user_id] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        // Fetch usernames
        const userIds = sorted.map(([id]) => id);
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, username')
          .in('id', userIds);

        const usersMap = new Map(
          (users || []).map((u: { id: string; display_name: string; username: string }) => [u.id, u])
        );

        return {
          data: sorted.map(([id, count]) => ({
            display_name: usersMap.get(id)?.display_name || 'Unknown',
            username: usersMap.get(id)?.username || '',
            cards: count,
          })),
        };
      });

    return Response.json({
      totalUsers: totalUsers || 0,
      activeToday: activeToday || 0,
      totalCards: totalCards || 0,
      activeListings: activeListings || 0,
      cardTypes: cardTypes || 0,
      packTypes: packTypes || 0,
      richest: richest || [],
      topCollectors: topCollectors || [],
    });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
