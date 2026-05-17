import { supabase } from '@/lib/supabase';

// POST: update quest progress after an action
// Body: { userId, action, amount?, param? }
// action: 'buy_packs' | 'collect_cards' | 'disenchant' | 'sell_market' | 'daily_login'
export async function POST(request: Request) {
  try {
    const { userId, action, amount = 1, param } = await request.json();

    if (!userId || !action) {
      return Response.json({ error: 'userId and action required' }, { status: 400 });
    }

    // Get user's incomplete quests matching this action
    const { data: userQuests } = await supabase
      .from('user_quests')
      .select('*, quests(*)')
      .eq('user_id', userId)
      .eq('completed', false);

    if (!userQuests || userQuests.length === 0) {
      return Response.json({ updated: 0 });
    }

    let updated = 0;

    for (const uq of userQuests) {
      const quest = (uq as any).quests;
      if (!quest || quest.quest_type !== action) continue;

      // Check param match (e.g. rank for collect_rank)
      if (quest.quest_type === 'collect_rank' && quest.quest_param && param !== quest.quest_param) {
        continue;
      }

      const newProgress = Math.min(uq.progress + amount, quest.target_value);
      const isCompleted = newProgress >= quest.target_value;

      await supabase
        .from('user_quests')
        .update({
          progress: newProgress,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', uq.id);

      updated++;
    }

    return Response.json({ success: true, updated });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
