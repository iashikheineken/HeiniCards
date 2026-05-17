import { supabase } from '@/lib/supabase';

// GET: get pass levels + user progress
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  // Get all levels
  const { data: levels } = await supabase
    .from('svino_pass_levels')
    .select('*')
    .order('level', { ascending: true });

  let userXp = 0;
  let userLevel = 0;
  let claimedLevels: number[] = [];

  if (userId) {
    // Get user XP
    const { data: user } = await supabase
      .from('users')
      .select('xp, svino_pass_level')
      .eq('id', userId)
      .single();

    userXp = user?.xp || 0;
    userLevel = user?.svino_pass_level || 0;

    // Get claimed levels
    const { data: claims } = await supabase
      .from('user_pass_claims')
      .select('level')
      .eq('user_id', userId);

    claimedLevels = (claims || []).map((c: { level: number }) => c.level);
  }

  return Response.json({
    levels: levels || [],
    userXp,
    userLevel,
    claimedLevels,
  });
}

// POST: claim a level reward
export async function POST(request: Request) {
  try {
    const { userId, level } = await request.json();

    if (!userId || !level) {
      return Response.json({ error: 'userId and level required' }, { status: 400 });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('xp, svino_pass_level, balance')
      .eq('id', userId)
      .single();

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // Get level info
    const { data: levelData } = await supabase
      .from('svino_pass_levels')
      .select('*')
      .eq('level', level)
      .single();

    if (!levelData) return Response.json({ error: 'Level not found' }, { status: 404 });

    // Check XP requirement
    if (user.xp < levelData.xp_required) {
      return Response.json({ error: 'Недостаточно XP' }, { status: 400 });
    }

    // Check not already claimed
    const { data: existing } = await supabase
      .from('user_pass_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('level', level)
      .single();

    if (existing) {
      return Response.json({ error: 'Уже получено' }, { status: 400 });
    }

    // Grant reward
    if (levelData.reward_type === 'coins') {
      const amount = parseInt(levelData.reward_value);
      await supabase
        .from('users')
        .update({ balance: user.balance + amount })
        .eq('id', userId);
    }
    // xp_boost is passive — no direct action needed

    // Record claim
    await supabase
      .from('user_pass_claims')
      .insert({ user_id: userId, level });

    // Update user level if needed
    if (level > user.svino_pass_level) {
      await supabase
        .from('users')
        .update({ svino_pass_level: level })
        .eq('id', userId);
    }

    return Response.json({
      success: true,
      reward_type: levelData.reward_type,
      reward_label: levelData.reward_label,
    });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
