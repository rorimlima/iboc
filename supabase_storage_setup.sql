
-- Supabase Storage Configuration for IBOC Project

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('members_photos', 'members_photos', true),
  ('event_banners', 'event_banners', true),
  ('social_banners', 'social_banners', true),
  ('social_projects_gallery', 'social_projects_gallery', true),
  ('assets_photos', 'assets_photos', true),
  ('site_assets', 'site_assets', true),
  ('highlight_banners', 'highlight_banners', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies

-- 2.1 Public Access (Read)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN (
  'members_photos', 
  'event_banners', 
  'social_banners', 
  'social_projects_gallery', 
  'assets_photos', 
  'site_assets', 
  'highlight_banners'
));

-- 2.2 Public/Anon Access (Upload/Write)
-- Removida a restrição 'TO authenticated' para permitir uploads via 'anon'
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id IN (
  'members_photos', 
  'event_banners', 
  'social_banners', 
  'social_projects_gallery', 
  'assets_photos', 
  'site_assets', 
  'highlight_banners'
));

-- 2.3 Public/Anon Access (Update)
CREATE POLICY "Public Update Access"
ON storage.objects FOR UPDATE
USING ( bucket_id IN (
  'members_photos', 
  'event_banners', 
  'social_banners', 
  'social_projects_gallery', 
  'assets_photos', 
  'site_assets', 
  'highlight_banners'
));

-- 2.4 Public/Anon Access (Delete)
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING ( bucket_id IN (
  'members_photos', 
  'event_banners', 
  'social_banners', 
  'social_projects_gallery', 
  'assets_photos', 
  'site_assets', 
  'highlight_banners'
));
