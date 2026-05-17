import { supabase } from '@/lib/supabase';

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');

export async function POST(request: Request) {
  try {
    const { telegramId, action, targetUsername, value } = await request.json();

    // Only the main admin can use this
    if (telegramId !== ADMIN_TELEGRAM_ID) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!targetUsername || !action) {
      return Response.json({ error: 'action and targetUsername required' }, { status: 400 });
    }

    // Find target user by username, display_name, or telegram_id
    const cleanInput = targetUsername.replace('@', '').trim();
    let target: any = null;

    // Try by username (exact)
    const { data: byUsername } = await supabase
      .from('users')
      .select('*')
      .eq('username', cleanInput)
      .single();
    target = byUsername;

    // Try by display_name (case-insensitive)
    if (!target) {
      const { data: byName } = await supabase
        .from('users')
        .select('*')
        .ilike('display_name', cleanInput)
        .single();
      target = byName;
    }

    // Try by telegram_id (if it's a number)
    if (!target && /^\d+$/.test(cleanInput)) {
      const { data: byTgId } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', parseInt(cleanInput))
        .single();
      target = byTgId;
    }

    if (!target) {
      return Response.json({ error: `Пользователь "${cleanInput}" не найден. Попробуй другое имя или telegram_id` }, { status: 404 });
    }

    const displayLabel = target.display_name || target.username || target.telegram_id;

    switch (action) {
      case 'set_admin': {
        const { error } = await supabase
          .from('users')
          .update({ is_admin: true })
          .eq('id', target.id);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({
          success: true,
          message: `✅ ${displayLabel} теперь админ!`,
        });
      }

      case 'remove_admin': {
        if (target.telegram_id === ADMIN_TELEGRAM_ID) {
          return Response.json({ error: 'Нельзя снять права главного админа' }, { status: 400 });
        }
        const { error } = await supabase
          .from('users')
          .update({ is_admin: false })
          .eq('id', target.id);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({
          success: true,
          message: `✅ ${displayLabel} больше не админ`,
        });
      }

      case 'set_balance': {
        const amount = parseInt(value);
        if (isNaN(amount) || amount < 0) {
          return Response.json({ error: 'Некорректная сумма' }, { status: 400 });
        }
        const { error } = await supabase
          .from('users')
          .update({ balance: amount })
          .eq('id', target.id);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({
          success: true,
          message: `✅ Баланс ${displayLabel}: ${amount} 🪙`,
        });
      }

      case 'add_balance': {
        const amount = parseInt(value);
        if (isNaN(amount)) {
          return Response.json({ error: 'Некорректная сумма' }, { status: 400 });
        }
        const newBalance = target.balance + amount;
        const { error } = await supabase
          .from('users')
          .update({ balance: Math.max(0, newBalance) })
          .eq('id', target.id);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({
          success: true,
          message: `✅ ${displayLabel}: ${target.balance} → ${Math.max(0, newBalance)} 🪙 (${amount >= 0 ? '+' : ''}${amount})`,
        });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
