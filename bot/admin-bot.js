/**
 * HeiniCards Admin Telegram Bot
 * 
 * Commands:
 *   /start     - Welcome + Play button
 *   /stats     - Game statistics
 *   /players   - Top by balance
 *   /collectors - Top card collectors
 *   /setadmin @user     - Grant admin
 *   /removeadmin @user  - Revoke admin
 *   /setbalance @user 5000  - Set balance
 *   /addbalance @user 1000  - Add to balance
 *   /link      - App link
 */

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: '.env.local' });

const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not set! Add it to .env.local');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 HeiniCards Admin Bot started!');

function isAdmin(msg) {
  return msg.from.id === ADMIN_TELEGRAM_ID;
}

// Helper: call manage API
async function callManageAPI(action, targetUsername, value) {
  const res = await fetch(`${APP_URL}/api/admin/manage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegramId: ADMIN_TELEGRAM_ID,
      action,
      targetUsername,
      value,
    }),
  });
  return res.json();
}

// Helper: call stats API
async function callStatsAPI() {
  const res = await fetch(`${APP_URL}/api/admin/stats?telegram_id=${ADMIN_TELEGRAM_ID}`);
  return res.json();
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
      `👑 /setadmin @user — Выдать админку\n` +
      `🚫 /removeadmin @user — Забрать админку\n` +
      `💵 /setbalance @user 5000 — Установить баланс\n` +
      `➕ /addbalance @user 1000 — Добавить монет\n` +
      `🔗 /link — Ссылка на приложение`,
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(chatId,
      `🎮 *HeiniCards*\n\nДобро пожаловать! Нажми кнопку ниже:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: APP_URL } }]]
        }
      }
    );
  }
});

// /stats
bot.onText(/\/stats/, async (msg) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const data = await callStatsAPI();
    if (data.error) { bot.sendMessage(chatId, `❌ ${data.error}`); return; }
    bot.sendMessage(chatId,
      `📊 *Статистика HeiniCards*\n\n` +
      `👥 Игроков: *${data.totalUsers}*\n` +
      `🟢 Активных сегодня: *${data.activeToday}*\n` +
      `🃏 Карт в обороте: *${data.totalCards}*\n` +
      `📦 Типов карт: *${data.cardTypes}*\n` +
      `🎁 Активных паков: *${data.packTypes}*\n` +
      `🏪 Лотов на маркете: *${data.activeListings}*`,
      { parse_mode: 'Markdown' }
    );
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /players
bot.onText(/\/players/, async (msg) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const data = await callStatsAPI();
    if (!data.richest?.length) { bot.sendMessage(chatId, '📭 Нет игроков'); return; }
    let text = `💰 *Топ по балансу:*\n\n`;
    data.richest.forEach((u, i) => {
      const medal = i < 3 ? ['🥇','🥈','🥉'][i] : `${i+1}.`;
      text += `${medal} *${u.display_name}* — ${u.balance} 🪙\n`;
    });
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /collectors
bot.onText(/\/collectors/, async (msg) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const data = await callStatsAPI();
    if (!data.topCollectors?.length) { bot.sendMessage(chatId, '📭 Нет коллекционеров'); return; }
    let text = `🃏 *Топ коллекционеры:*\n\n`;
    data.topCollectors.forEach((u, i) => {
      const medal = i < 3 ? ['🥇','🥈','🥉'][i] : `${i+1}.`;
      text += `${medal} *${u.display_name}* — ${u.cards} карт\n`;
    });
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /setadmin @username
bot.onText(/\/setadmin\s+@?(\S+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const data = await callManageAPI('set_admin', match[1]);
    bot.sendMessage(chatId, data.message || data.error);
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /removeadmin @username
bot.onText(/\/removeadmin\s+@?(\S+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const data = await callManageAPI('remove_admin', match[1]);
    bot.sendMessage(chatId, data.message || data.error);
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /setbalance @username 5000
bot.onText(/\/setbalance\s+@?(\S+)\s+(\d+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const data = await callManageAPI('set_balance', match[1], match[2]);
    bot.sendMessage(chatId, data.message || data.error);
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /addbalance @username 1000 (can be negative)
bot.onText(/\/addbalance\s+@?(\S+)\s+(-?\d+)/, async (msg, match) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;
  try {
    const data = await callManageAPI('add_balance', match[1], match[2]);
    bot.sendMessage(chatId, data.message || data.error);
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// /link
bot.onText(/\/link/, (msg) => {
  bot.sendMessage(msg.chat.id, `🔗 ${APP_URL}`, {
    reply_markup: { inline_keyboard: [[{ text: '🎮 Открыть', web_app: { url: APP_URL } }]] }
  });
});

console.log(`📡 Admin ID: ${ADMIN_TELEGRAM_ID} | App: ${APP_URL}`);
