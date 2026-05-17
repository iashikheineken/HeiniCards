-- ================================================
-- HeiniCards — Storage & Seasons Setup
-- Запусти этот SQL в Supabase SQL Editor
-- ================================================

-- Таблица сезонов (для динамических рамок/рубашек)
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  frame_s_url TEXT,    -- рамка для S-ранга
  frame_a_url TEXT,    -- рамка для A-ранга
  frame_b_url TEXT,    -- рамка для B-ранга
  frame_c_url TEXT,    -- рамка для C-ранга
  card_back_url TEXT,  -- рубашка карт
  rank_icon_s_url TEXT,
  rank_icon_a_url TEXT,
  rank_icon_b_url TEXT,
  rank_icon_c_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS для сезонов
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seasons are viewable by everyone"
  ON seasons FOR SELECT
  USING (true);

CREATE POLICY "Seasons can be inserted"
  ON seasons FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Seasons can be updated"
  ON seasons FOR UPDATE
  USING (true);

-- Начальный сезон (без рамок — будут загружены через админку)
INSERT INTO seasons (name, is_active)
VALUES ('Сезон 1 — Начало', true);

-- Разрешить обновление карт и паков (для админки)
CREATE POLICY "Cards can be updated"
  ON cards FOR UPDATE
  USING (true);

CREATE POLICY "Cards can be deleted"
  ON cards FOR DELETE
  USING (true);

CREATE POLICY "Packs can be updated"
  ON packs FOR UPDATE
  USING (true);

CREATE POLICY "Packs can be deleted"
  ON packs FOR DELETE
  USING (true);

CREATE POLICY "Pack cards can be updated"
  ON pack_cards FOR UPDATE
  USING (true);

CREATE POLICY "Pack cards can be deleted"
  ON pack_cards FOR DELETE
  USING (true);
