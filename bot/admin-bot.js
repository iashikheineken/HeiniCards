/**
 * HeiniCards Admin Telegram Bot
 * Works directly with Supabase (no API dependency)
 */

const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!BOT_TOKEN) { console.error('❌ BOT_TOKEN not set!'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('❌ Supabase credentials not set!'); process.exit(1); }

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🤖 HeiniCards Admin Bot started!');
console.log(`📡 Admin ID: ${ADMIN_TELEGRAM_ID}`);
console.log(`🔗 App: ${APP_URL}`);

function isAdmin(msg) {
  return msg.from.id === ADMIN_TELEGRAM_ID;
}

// Find user by any identifier: username, display_name, telegram_id, player_XXX
async function findUser(input) {
  const clean = input.replace('@', '').trim();

  // Try by telegram_id (direct number or player_XXX format)
  let tgId = null;
  if (/^\d+$/.test(clean)) {
    tgId = parseInt(clean);
  } else if (/^player_\d+$/i.test(clean)) {
    tgId = parseInt(clean.replace(/^player_/i, ''));
  }

  if (tgId) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', tgId)
      .single();
    if (data) return data;
  }

  // Try by username (exact)
  const { data: byUsername } = await supabase
    .from('users')
    .select('*')
    .eq('username', clean)
    .single();
  if (byUsername) return byUsername;

  // Try by display_name (case-insensitive)
  const { data: byName } = await supabase
    .from('users')
    .select('*')
    .ilike('display_name', `%${clean}%`)
    .limit(1)
    .single();
  if (byName) return byName;

  return null;
}

function userLabel(user) {
  return user.display_name || user.username || `ID:${user.telegram_id}`;
}

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (isAdmin(msg)) {
    bot.sendMessage(chatId,
      `🎮 *HeiniCards Admin Bot*\n\n` +
      `📊 /stats — Статистика\n` +
      `💰 /players — Топ по балансу\n` +
      `🃏 /collectors — Топ коллекционеры\n\n` +
      `*Управление:*\n` +
      `👑 /setadmin <имя или tg\\_id> — Выдать админку\n` +
      `🚫 /removeadmin <имя или tg\\_id> — Забрать\n` +
      `💵 /setbalance <имя> <сумма> — Установить баланс\n` +
      `➕ /addbalance <имя> <сумма> — Добавить монет\n` +
      `🔍 /find <имя или tg\\_id> — Найти игрока\n` +
      `🔗 /link — Ссылка на приложение`,
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(chatId,
      `🎮 *HeiniCards*\n\nДобро пожаловать! Нажми кнопку ниже:`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: APP_URL } }]] }
      }
    );
  }
});

// /find — search for a user
bot.onText(/\/find\s+(.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const user = await findUser(match[1]);
    if (!user) {
      bot.sendMessage(chatId, `❌ Игрок "${match[1]}" не найден`);
      return;
    }
    bot.sendMessage(chatId,
      `👤 *Игрок найден:*\n\n` +
      `📛 Имя: *${user.display_name || '—'}*\n` +
      `🆔 Username: ${user.username || '—'}\n` +
      `🔢 Telegram ID: \`${user.telegram_id}\`\n` +
      `💰 Баланс: *${user.balance}* 🪙\n` +
      `⚡ XP: *${user.xp || 0}*\n` +
      `👑 Админ: ${user.is_admin ? '✅' : '❌'}\n` +
      `📅 Создан: ${new Date(user.created_at).toLocaleDateString('ru')}`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) { bot.sendMessage(chatId, `❌ Ошибка: ${e.message}`); }
});

// /stats
bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalCards } = await supabase.from('user_cards').select('*', { count: 'exact', head: true });
    const { count: cardTypes } = await supabase.from('cards').select('*', { count: 'exact', head: true });
    const { count: packTypes } = await supabase.from('packs').select('*', { count: 'exact', head: true }).eq('is_active', true);
    const { count: activeListings } = await supabase.from('market_listings').select('*', { count: 'exact', head: true }).eq('status', 'active');

    bot.sendMessage(chatId,
      `📊 *Статистика HeiniCards*\n\n` +
      `👥 Игроков: *${totalUsers || 0}*\n` +
      `🃏 Карт в обороте: *${totalCards || 0}*\n` +
      `📦 Типов карт: *${cardTypes || 0}*\n` +
      `🎁 Активных паков: *${packTypes || 0}*\n` +
      `🏪 Лотов на маркете: *${activeListings || 0}*`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /players
bot.onText(/\/players/, async (msg) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const { data: richest } = await supabase.from('users').select('display_name, username, balance, telegram_id').order('balance', { ascending: false }).limit(10);
    if (!richest?.length) { bot.sendMessage(chatId, '📭 Нет игроков'); return; }
    let text = `💰 *Топ по балансу:*\n\n`;
    richest.forEach((u, i) => {
      const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
      text += `${medal} *${u.display_name || u.username}* — ${u.balance} 🪙 (tg: \`${u.telegram_id}\`)\n`;
    });
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /collectors
bot.onText(/\/collectors/, async (msg) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const { data: allCards } = await supabase.from('user_cards').select('user_id');
    if (!allCards?.length) { bot.sendMessage(chatId, '📭 Нет коллекционеров'); return; }
    const counts = {};
    allCards.forEach(row => { counts[row.user_id] = (counts[row.user_id] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const userIds = sorted.map(([id]) => id);
    const { data: users } = await supabase.from('users').select('id, display_name, username, telegram_id').in('id', userIds);
    const usersMap = new Map((users || []).map(u => [u.id, u]));

    let text = `🃏 *Топ коллекционеры:*\n\n`;
    sorted.forEach(([id, count], i) => {
      const u = usersMap.get(id);
      const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
      text += `${medal} *${u?.display_name || u?.username || 'Unknown'}* — ${count} карт\n`;
    });
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /setadmin
bot.onText(/\/setadmin\s+(.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const user = await findUser(match[1]);
    if (!user) { bot.sendMessage(chatId, `❌ Игрок "${match[1]}" не найден. Используй /find чтобы проверить.`); return; }
    await supabase.from('users').update({ is_admin: true }).eq('id', user.id);
    bot.sendMessage(chatId, `✅ ${userLabel(user)} (tg: \`${user.telegram_id}\`) теперь *админ*!`, { parse_mode: 'Markdown' });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /removeadmin
bot.onText(/\/removeadmin\s+(.+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const user = await findUser(match[1]);
    if (!user) { bot.sendMessage(chatId, `❌ Игрок "${match[1]}" не найден`); return; }
    if (user.telegram_id === ADMIN_TELEGRAM_ID) { bot.sendMessage(chatId, '❌ Нельзя снять главного админа'); return; }
    await supabase.from('users').update({ is_admin: false }).eq('id', user.id);
    bot.sendMessage(chatId, `✅ ${userLabel(user)} больше *не админ*`, { parse_mode: 'Markdown' });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /setbalance
bot.onText(/\/setbalance\s+(\S+)\s+(\d+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const user = await findUser(match[1]);
    if (!user) { bot.sendMessage(chatId, `❌ Игрок "${match[1]}" не найден. Используй /find`); return; }
    const amount = parseInt(match[2]);
    await supabase.from('users').update({ balance: amount }).eq('id', user.id);
    bot.sendMessage(chatId, `✅ Баланс ${userLabel(user)}: *${amount}* 🪙`, { parse_mode: 'Markdown' });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /addbalance (supports negative)
bot.onText(/\/addbalance\s+(\S+)\s+(-?\d+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const user = await findUser(match[1]);
    if (!user) { bot.sendMessage(chatId, `❌ Игрок "${match[1]}" не найден`); return; }
    const amount = parseInt(match[2]);
    const newBalance = Math.max(0, user.balance + amount);
    await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
    bot.sendMessage(chatId, `✅ ${userLabel(user)}: ${user.balance} → *${newBalance}* 🪙 (${amount >= 0 ? '+' : ''}${amount})`, { parse_mode: 'Markdown' });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /link
bot.onText(/\/link/, (msg) => {
  bot.sendMessage(msg.chat.id, `🔗 ${APP_URL}`, {
    reply_markup: { inline_keyboard: [[{ text: '🎮 Открыть', web_app: { url: APP_URL } }]] }
  });
});
