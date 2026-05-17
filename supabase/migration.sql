-- ================================================
-- HeiniCards — Database Setup
-- Запусти этот SQL в Supabase Dashboard:
-- SQL Editor → New Query → вставь этот код → Run
-- ================================================

-- 1. Таблица карт
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rank TEXT NOT NULL CHECK (rank IN ('S', 'A', 'B', 'C')),
  description TEXT,
  attack INTEGER NOT NULL DEFAULT 0,
  defense INTEGER NOT NULL DEFAULT 0,
  art_url TEXT,
  gradient TEXT,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Таблица паков
CREATE TABLE IF NOT EXISTS packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 100,
  card_count INTEGER NOT NULL DEFAULT 3,
  gradient TEXT,
  emoji TEXT,
  cover_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Связь пак → карты
CREATE TABLE IF NOT EXISTS pack_cards (
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  drop_weight INTEGER DEFAULT 1,
  PRIMARY KEY (pack_id, card_id)
);

-- 4. Пользователи
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT,
  balance INTEGER NOT NULL DEFAULT 500,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_daily_reward TIMESTAMPTZ
);

-- 5. Инвентарь
CREATE TABLE IF NOT EXISTS user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  obtained_at TIMESTAMPTZ DEFAULT now(),
  is_on_market BOOLEAN DEFAULT false
);

-- ================================================
-- Row Level Security (RLS)
-- ================================================

-- Включаем RLS для всех таблиц
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- Карты и паки: все могут читать
CREATE POLICY "Cards are viewable by everyone"
  ON cards FOR SELECT
  USING (true);

CREATE POLICY "Packs are viewable by everyone"
  ON packs FOR SELECT
  USING (true);

CREATE POLICY "Pack cards are viewable by everyone"
  ON pack_cards FOR SELECT
  USING (true);

-- Пользователи: все могут читать (для маркета), вставлять (регистрация)
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can be created"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (true);

-- Инвентарь: все могут читать (для маркета)
CREATE POLICY "User cards are viewable by everyone"
  ON user_cards FOR SELECT
  USING (true);

CREATE POLICY "User cards can be inserted"
  ON user_cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "User cards can be updated"
  ON user_cards FOR UPDATE
  USING (true);

CREATE POLICY "User cards can be deleted"
  ON user_cards FOR DELETE
  USING (true);

-- Карты и паки: только админ может редактировать (через service_role позже)
-- Пока разрешим всем для seed-данных
CREATE POLICY "Cards can be inserted"
  ON cards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Packs can be inserted"
  ON packs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Pack cards can be inserted"
  ON pack_cards FOR INSERT
  WITH CHECK (true);

-- ================================================
-- SEED DATA: Начальные карты
-- ================================================

INSERT INTO cards (name, rank, description, attack, defense, emoji, gradient) VALUES
  ('Хейни-Берсерк', 'S', 'Древний воин, пробуждённый гневом тысячи свиней. Его топор рассекает саму реальность.', 99, 45, '⚔️', 'linear-gradient(135deg, #1a0030, #4a0080, #ff00ff22)'),
  ('Свинамант', 'S', 'Повелитель тёмных искусств. Его заклинания обращают врагов в бекон.', 85, 70, '🔮', 'linear-gradient(135deg, #0a0030, #2a0060, #8000ff22)'),
  ('Пятачок-Ронин', 'A', 'Мастер клинка без хозяина. Бродит по землям в поисках достойного противника.', 72, 55, '🗡️', 'linear-gradient(135deg, #1a1a00, #3a3a00, #ffd70022)'),
  ('Хрюно-Механик', 'A', 'Гений инженерии. Собирает боевых мехов из мусора и желудей.', 60, 80, '⚙️', 'linear-gradient(135deg, #1a1000, #3a2000, #ff880022)'),
  ('Свино-Лучник', 'B', 'Меткий стрелок из Дубового леса. Никогда не промахивается... почти.', 55, 35, '🏹', 'linear-gradient(135deg, #001a0a, #003a1a, #00ff8822)'),
  ('Хряк-Щитоносец', 'B', 'Непробиваемая стена из сала и стали. Защитит любого союзника.', 30, 75, '🛡️', 'linear-gradient(135deg, #0a0a1a, #1a1a3a, #4488ff22)'),
  ('Поросёнок-Скаут', 'C', 'Шустрый разведчик. Маленький, но очень наглый.', 25, 20, '🐽', 'linear-gradient(135deg, #1a0a0a, #3a1a1a, #ff444422)'),
  ('Свинка-Травница', 'C', 'Лечит раны отваром из трюфелей. Мирная, но полезная.', 15, 40, '🌿', 'linear-gradient(135deg, #0a1a0a, #1a3a1a, #44ff4422)'),
  ('Кабан-Алхимик', 'A', 'Превращает грязь в золото, а золото — в ещё больше грязи. Странный тип.', 65, 50, '⚗️', 'linear-gradient(135deg, #1a1a00, #2a2a10, #aaff0022)'),
  ('Пятак-Призрак', 'B', 'Бывший фермер, ставший неупокоенным духом. Пугает, но не кусает.', 45, 45, '👻', 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #aaaaff22)');

-- ================================================
-- SEED DATA: Паки
-- ================================================

INSERT INTO packs (name, description, price, card_count, gradient, emoji) VALUES
  ('Стартовый Набор', 'Базовый набор для новичков. Содержит карты C и B ранга.', 100, 3, 'linear-gradient(135deg, #1a3a2a, #0a2a1a, #00ff8844)', '📦'),
  ('Воинский Сундук', 'Набор для опытных бойцов. Шанс получить A-ранг карту!', 350, 5, 'linear-gradient(135deg, #3a2a00, #2a1a00, #ffd70044)', '⚔️'),
  ('Тёмный Ритуал', 'Редчайший набор. Гарантированная S-ранг карта!', 1000, 5, 'linear-gradient(135deg, #2a003a, #1a0020, #ff00ff44)', '🔮'),
  ('Свиной Джекпот', 'Крути рулетку удачи! Может выпасть ЧТО УГОДНО.', 500, 7, 'linear-gradient(135deg, #3a0a0a, #200a0a, #ff444444)', '🎰');

-- ================================================
-- SEED DATA: Связи пак → карты
-- (Используем подзапросы для получения UUID)
-- ================================================

-- Стартовый Набор: B и C ранг карты
INSERT INTO pack_cards (pack_id, card_id, drop_weight)
SELECT p.id, c.id,
  CASE c.rank WHEN 'B' THEN 2 WHEN 'C' THEN 3 ELSE 1 END
FROM packs p, cards c
WHERE p.name = 'Стартовый Набор'
  AND c.rank IN ('B', 'C');

-- Воинский Сундук: A и B ранг
INSERT INTO pack_cards (pack_id, card_id, drop_weight)
SELECT p.id, c.id,
  CASE c.rank WHEN 'A' THEN 2 WHEN 'B' THEN 3 ELSE 1 END
FROM packs p, cards c
WHERE p.name = 'Воинский Сундук'
  AND c.rank IN ('A', 'B');

-- Тёмный Ритуал: S и A ранг
INSERT INTO pack_cards (pack_id, card_id, drop_weight)
SELECT p.id, c.id,
  CASE c.rank WHEN 'S' THEN 1 WHEN 'A' THEN 2 ELSE 1 END
FROM packs p, cards c
WHERE p.name = 'Тёмный Ритуал'
  AND c.rank IN ('S', 'A');

-- Свиной Джекпот: все карты
INSERT INTO pack_cards (pack_id, card_id, drop_weight)
SELECT p.id, c.id,
  CASE c.rank WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 4 WHEN 'C' THEN 6 ELSE 1 END
FROM packs p, cards c
WHERE p.name = 'Свиной Джекпот';

-- ================================================
-- SEED DATA: Админ-пользователь
-- ================================================

INSERT INTO users (telegram_id, username, display_name, balance, is_admin)
VALUES (1188955233, 'admin', 'Админ', 9999, true);

-- Дадим админу несколько карт для теста
INSERT INTO user_cards (user_id, card_id)
SELECT u.id, c.id
FROM users u, cards c
WHERE u.telegram_id = 1188955233
  AND c.name IN ('Пятачок-Ронин', 'Свино-Лучник', 'Хряк-Щитоносец', 'Поросёнок-Скаут', 'Свинка-Травница', 'Пятак-Призрак');
