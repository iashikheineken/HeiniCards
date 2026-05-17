import { supabase } from '@/lib/supabase';

// GET: get user's quests (auto-assign daily quests if needed)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) return Response.json({ error: 'user_id required' }, { status: 400 });

  // 1. Get all active quests
  const { data: allQuests } = await supabase
    .from('quests')
    .select('*')
    .eq('is_active', true);

  if (!allQuests) return Response.json({ daily: [], global: [] });

  // 2. Get user's current quest entries
  const { data: userQuests } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', userId);

  const existingMap = new Map(
    (userQuests || []).map((uq: any) => [uq.quest_id, uq])
  );

  // 3. Check if daily quests need reset (assigned_at < today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyQuests = allQuests.filter(q => q.is_daily);
  const globalQuests = allQuests.filter(q => !q.is_daily);

  // Auto-assign daily quests
  for (const quest of dailyQuests) {
    const existing = existingMap.get(quest.id);
    if (!existing) {
      // Never assigned - create entry
      const { data: newEntry } = await supabase
        .from('user_quests')
        .insert({ user_id: userId, quest_id: quest.id, progress: 0 })
        .select()
        .single();
      if (newEntry) existingMap.set(quest.id, newEntry);
    } else {
      // Check if needs daily reset
      const assignedAt = new Date(existing.assigned_at);
      if (assignedAt < today && existing.claimed) {
        // Reset daily quest
        const { data: updated } = await supabase
          .from('user_quests')
          .update({
            progress: 0,
            completed: false,
            claimed: false,
            assigned_at: new Date().toISOString(),
            completed_at: null,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (updated) existingMap.set(quest.id, updated);
      }
    }
  }

  // Auto-assign global quests
  for (const quest of globalQuests) {
    if (!existingMap.has(quest.id)) {
      const { data: newEntry } = await supabase
        .from('user_quests')
        .insert({ user_id: userId, quest_id: quest.id, progress: 0 })
        .select()
        .single();
      if (newEntry) existingMap.set(quest.id, newEntry);
    }
  }

  // 4. Build response
  const buildQuest = (quest: any) => {
    const uq = existingMap.get(quest.id);
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      quest_type: quest.quest_type,
      target_value: quest.target_value,
      quest_param: quest.quest_param,
      reward_type: quest.reward_type,
      reward_value: quest.reward_value,
      is_daily: quest.is_daily,
      progress: uq?.progress || 0,
      completed: uq?.completed || false,
      claimed: uq?.claimed || false,
      user_quest_id: uq?.id,
    };
  };

  return Response.json({
    daily: dailyQuests.map(buildQuest),
    global: globalQuests.map(buildQuest),
  });
}

// POST: claim quest reward
export async function POST(request: Request) {
  try {
    const { userId, questId } = await request.json();

    // Get user quest entry
    const { data: uq } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();

    if (!uq) return Response.json({ error: 'Quest not found' }, { status: 404 });
    if (!uq.completed) return Response.json({ error: 'Quest not completed' }, { status: 400 });
    if (uq.claimed) return Response.json({ error: 'Already claimed' }, { status: 400 });

    // Get quest info
    const { data: quest } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single();

    if (!quest) return Response.json({ error: 'Quest not found' }, { status: 404 });

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('balance, xp')
      .eq('id', userId)
      .single();

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // Grant reward
    const updates: any = {};
    if (quest.reward_type === 'coins') {
      updates.balance = user.balance + quest.reward_value;
    } else if (quest.reward_type === 'xp') {
      updates.xp = user.xp + quest.reward_value;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', userId);
    }

    // Mark as claimed
    await supabase
      .from('user_quests')
      .update({ claimed: true })
      .eq('id', uq.id);

    return Response.json({
      success: true,
      reward_type: quest.reward_type,
      reward_value: quest.reward_value,
    });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
