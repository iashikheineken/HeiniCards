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

    // Find target user by username
    const cleanUsername = targetUsername.replace('@', '');
    const { data: target, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('username', cleanUsername)
      .single();

    if (findError || !target) {
      return Response.json({ error: `Пользователь @${cleanUsername} не найден` }, { status: 404 });
    }

    switch (action) {
      case 'set_admin': {
        const { error } = await supabase
          .from('users')
          .update({ is_admin: true })
          .eq('id', target.id);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({
          success: true,
          message: `✅ @${cleanUsername} теперь админ!`,
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
          message: `✅ @${cleanUsername} больше не админ`,
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
          message: `✅ Баланс @${cleanUsername}: ${amount} 🪙`,
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
          message: `✅ @${cleanUsername}: ${target.balance} → ${Math.max(0, newBalance)} 🪙 (${amount >= 0 ? '+' : ''}${amount})`,
        });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
