/**
 * HeiniCards Admin Telegram Bot
 * 
 * Usage:
 *   1. npm install node-telegram-bot-api
 *   2. Set BOT_TOKEN and APP_URL in .env or below
 *   3. node bot/admin-bot.js
 * 
 * Commands:
 *   /stats - Show game statistics
 *   /players - Top players by balance
 *   /collectors - Top card collectors
 *   /broadcast <message> - (future) Send message to all users
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

// Check if sender is admin
function isAdmin(msg) {
  return msg.from.id === ADMIN_TELEGRAM_ID;
}

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (isAdmin(msg)) {
    bot.sendMessage(chatId,
      `🎮 *HeiniCards Admin Bot*\n\n` +
      `Привет, админ! Вот доступные команды:\n\n` +
      `📊 /stats — Статистика игры\n` +
      `💰 /players — Топ по балансу\n` +
      `🃏 /collectors — Топ коллекционеры\n` +
      `🔗 /link — Ссылка на приложение`,
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(chatId,
      `🎮 *HeiniCards*\n\n` +
      `Добро пожаловать! Нажми кнопку ниже, чтобы начать играть:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🎮 Играть', web_app: { url: APP_URL } }
          ]]
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
    const res = await fetch(`${APP_URL}/api/admin/stats?telegram_id=${ADMIN_TELEGRAM_ID}`);
    const data = await res.json();

    if (data.error) {
      bot.sendMessage(chatId, `❌ Ошибка: ${data.error}`);
      return;
    }

    const text =
      `📊 *Статистика HeiniCards*\n\n` +
      `👥 Игроков: *${data.totalUsers}*\n` +
      `🟢 Активных сегодня: *${data.activeToday}*\n` +
      `🃏 Карт в обороте: *${data.totalCards}*\n` +
      `📦 Типов карт: *${data.cardTypes}*\n` +
      `🎁 Активных паков: *${data.packTypes}*\n` +
      `🏪 Лотов на маркете: *${data.activeListings}*`;

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (e) {
    bot.sendMessage(chatId, `❌ Ошибка: ${e.message}`);
  }
});

// /players
bot.onText(/\/players/, async (msg) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;

  try {
    const res = await fetch(`${APP_URL}/api/admin/stats?telegram_id=${ADMIN_TELEGRAM_ID}`);
    const data = await res.json();

    if (!data.richest || data.richest.length === 0) {
      bot.sendMessage(chatId, '📭 Пока нет игроков');
      return;
    }

    let text = `💰 *Топ игроков по балансу:*\n\n`;
    data.richest.forEach((u, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      text += `${medal} *${u.display_name}* — ${u.balance} 🪙\n`;
    });

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (e) {
    bot.sendMessage(chatId, `❌ Ошибка: ${e.message}`);
  }
});

// /collectors
bot.onText(/\/collectors/, async (msg) => {
  if (!isAdmin(msg)) return;
  const chatId = msg.chat.id;

  try {
    const res = await fetch(`${APP_URL}/api/admin/stats?telegram_id=${ADMIN_TELEGRAM_ID}`);
    const data = await res.json();

    if (!data.topCollectors || data.topCollectors.length === 0) {
      bot.sendMessage(chatId, '📭 Пока нет коллекционеров');
      return;
    }

    let text = `🃏 *Топ коллекционеры:*\n\n`;
    data.topCollectors.forEach((u, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      text += `${medal} *${u.display_name}* — ${u.cards} карт\n`;
    });

    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (e) {
    bot.sendMessage(chatId, `❌ Ошибка: ${e.message}`);
  }
});

// /link
bot.onText(/\/link/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    `🔗 Ссылка на приложение:\n${APP_URL}`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Открыть', web_app: { url: APP_URL } }
        ]]
      }
    }
  );
});

console.log(`📡 Listening... Admin ID: ${ADMIN_TELEGRAM_ID}`);
