import { type NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

const DAILY_REWARD = 200;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already claimed today
    const now = new Date();
    const lastReward = user.last_daily_reward ? new Date(user.last_daily_reward) : null;

    if (lastReward) {
      const isSameDay =
        lastReward.getUTCFullYear() === now.getUTCFullYear() &&
        lastReward.getUTCMonth() === now.getUTCMonth() &&
        lastReward.getUTCDate() === now.getUTCDate();

      if (isSameDay) {
        return Response.json({
          error: 'Already claimed today',
          alreadyClaimed: true,
          nextRewardAt: getNextMidnight(),
        }, { status: 400 });
      }
    }

    // Give reward
    const { error: updateError } = await supabase
      .from('users')
      .update({
        balance: user.balance + DAILY_REWARD,
        last_daily_reward: now.toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      return Response.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    return Response.json({
      success: true,
      reward: DAILY_REWARD,
      newBalance: user.balance + DAILY_REWARD,
    });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNextMidnight(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
