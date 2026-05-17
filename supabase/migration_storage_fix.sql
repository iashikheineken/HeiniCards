-- ================================================
-- HeiniCards — Storage Policy Fix
-- Запусти этот SQL в Supabase SQL Editor
-- ================================================

-- Разрешить загрузку файлов в бакет heini-assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('heini-assets', 'heini-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Разрешить всем загружать файлы (для анон-ключа)
CREATE POLICY "Allow public uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'heini-assets');

-- Разрешить всем читать файлы
CREATE POLICY "Allow public reads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'heini-assets');

-- Разрешить удаление файлов
CREATE POLICY "Allow public deletes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'heini-assets');

-- Разрешить обновление файлов
CREATE POLICY "Allow public updates"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'heini-assets');
