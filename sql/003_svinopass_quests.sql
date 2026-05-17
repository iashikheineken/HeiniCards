-- ============================================
-- HeiniCards: SvinoPass + Quests Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add XP columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS svino_pass_level INT DEFAULT 0;

-- 2. SvinoPass levels table
CREATE TABLE IF NOT EXISTS svino_pass_levels (
  level INT PRIMARY KEY,
  xp_required INT NOT NULL,
  reward_type TEXT NOT NULL,       -- 'coins', 'xp_boost', 'pack'
  reward_value TEXT NOT NULL,      -- amount or id
  reward_label TEXT NOT NULL       -- display text
);

-- 3. User claimed levels
CREATE TABLE IF NOT EXISTS user_pass_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INT REFERENCES svino_pass_levels(level),
  claimed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, level)
);

-- 4. Quests table
CREATE TABLE IF NOT EXISTS quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL,         -- 'buy_packs', 'collect_cards', 'collect_rank', 'disenchant', 'sell_market', 'earn_coins', 'daily_login', 'open_packs'
  target_value INT NOT NULL,        -- how much needed
  quest_param TEXT DEFAULT NULL,    -- optional param e.g. rank 'A' for collect_rank
  reward_type TEXT NOT NULL,        -- 'coins', 'xp'
  reward_value INT NOT NULL,
  is_daily BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. User quest progress
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 6. RLS policies
ALTER TABLE svino_pass_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pass_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

-- Allow read for all
CREATE POLICY "Anyone can read pass levels" ON svino_pass_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can read quests" ON quests FOR SELECT USING (true);
CREATE POLICY "Anyone can read user quests" ON user_quests FOR SELECT USING (true);
CREATE POLICY "Anyone can read user pass claims" ON user_pass_claims FOR SELECT USING (true);

-- Allow insert/update/delete for service role (API)
CREATE POLICY "Service can manage pass claims" ON user_pass_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service can manage user quests" ON user_quests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service can manage quests" ON quests FOR ALL USING (true) WITH CHECK (true);

-- 7. Seed SvinoPass levels (30 levels)
INSERT INTO svino_pass_levels (level, xp_required, reward_type, reward_value, reward_label) VALUES
  (1,   50,   'coins', '100',  '100 🪙'),
  (2,   120,  'coins', '150',  '150 🪙'),
  (3,   200,  'coins', '200',  '200 🪙'),
  (4,   300,  'xp_boost', '10', '+10 бонус XP'),
  (5,   420,  'coins', '500',  '500 🪙'),
  (6,   560,  'coins', '200',  '200 🪙'),
  (7,   720,  'coins', '300',  '300 🪙'),
  (8,   900,  'xp_boost', '15', '+15 бонус XP'),
  (9,   1100, 'coins', '400',  '400 🪙'),
  (10,  1350, 'coins', '1000', '1000 🪙'),
  (11,  1600, 'coins', '300',  '300 🪙'),
  (12,  1900, 'xp_boost', '20', '+20 бонус XP'),
  (13,  2200, 'coins', '500',  '500 🪙'),
  (14,  2550, 'coins', '400',  '400 🪙'),
  (15,  2950, 'coins', '1500', '1500 🪙'),
  (16,  3400, 'coins', '500',  '500 🪙'),
  (17,  3900, 'xp_boost', '25', '+25 бонус XP'),
  (18,  4450, 'coins', '600',  '600 🪙'),
  (19,  5050, 'coins', '700',  '700 🪙'),
  (20,  5700, 'coins', '2000', '2000 🪙'),
  (21,  6400, 'coins', '800',  '800 🪙'),
  (22,  7200, 'xp_boost', '30', '+30 бонус XP'),
  (23,  8100, 'coins', '900',  '900 🪙'),
  (24,  9100, 'coins', '1000', '1000 🪙'),
  (25,  10200,'coins', '3000', '3000 🪙'),
  (26,  11400,'coins', '1200', '1200 🪙'),
  (27,  12800,'xp_boost', '40', '+40 бонус XP'),
  (28,  14400,'coins', '1500', '1500 🪙'),
  (29,  16200,'coins', '2000', '2000 🪙'),
  (30,  18200,'coins', '5000', '5000 🪙 🏆')
ON CONFLICT (level) DO NOTHING;

-- 8. Seed sample quests
INSERT INTO quests (title, description, quest_type, target_value, reward_type, reward_value, is_daily) VALUES
  -- Daily quests
  ('Открой пак',       'Купи и открой 1 пак',           'buy_packs',     1,  'xp',   30,  true),
  ('Коллекционер',     'Получи 3 новые карты',          'collect_cards',  3,  'xp',   20,  true),
  ('Торговец',         'Выстави карту на маркет',       'sell_market',    1,  'coins', 100, true),
  ('Расщепитель',      'Расщепи 2 карты',              'disenchant',     2,  'xp',   25,  true),
  ('Ежедневный бонус', 'Забери ежедневную награду',     'daily_login',    1,  'xp',   15,  true),
  -- Global quests
  ('Начинающий',       'Купи свой первый пак',          'buy_packs',     1,  'coins', 200, false),
  ('Собиратель',       'Собери 20 карт',               'collect_cards', 20,  'xp',   100, false),
  ('Элитный охотник',  'Собери 5 карт ранга A',        'collect_rank',   5,  'coins', 1000, false),
  ('Легендарный',      'Собери карту ранга S',          'collect_rank',   1,  'coins', 2000, false),
  ('Магнат маркета',   'Продай 10 карт на маркете',    'sell_market',   10,  'xp',   200, false),
  ('Разрушитель',      'Расщепи 20 карт',              'disenchant',    20,  'coins', 500, false),
  ('Пакоман',          'Открой 50 паков',              'buy_packs',     50,  'coins', 5000, false)
ON CONFLICT DO NOTHING;

-- Set quest_param for rank-specific quests
UPDATE quests SET quest_param = 'A' WHERE title = 'Элитный охотник';
UPDATE quests SET quest_param = 'S' WHERE title = 'Легендарный';
