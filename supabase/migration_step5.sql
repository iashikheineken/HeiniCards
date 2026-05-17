-- ================================================
-- HeiniCards — Market + Daily Reward
-- Запусти этот SQL в Supabase SQL Editor
-- ================================================

-- Таблица листингов маркета
CREATE TABLE IF NOT EXISTS market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id),
  price INTEGER NOT NULL CHECK (price > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_card_id)
);

-- RLS для маркета
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market listings are viewable by everyone"
  ON market_listings FOR SELECT USING (true);

CREATE POLICY "Market listings can be inserted"
  ON market_listings FOR INSERT WITH CHECK (true);

CREATE POLICY "Market listings can be deleted"
  ON market_listings FOR DELETE USING (true);

CREATE POLICY "Market listings can be updated"
  ON market_listings FOR UPDATE USING (true);
