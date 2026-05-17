-- ================================================
-- HeiniCards — Add art_position column
-- Запусти этот SQL в Supabase SQL Editor
-- ================================================

-- Добавить колонку для позиционирования арта на карточке
ALTER TABLE cards ADD COLUMN IF NOT EXISTS art_position TEXT DEFAULT 'center';
