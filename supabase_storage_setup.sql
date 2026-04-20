
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

-- 2.2 Authenticated Access (Upload/Write)
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id IN (
  'members_photos', 
  'event_banners', 
  'social_banners', 
  'social_projects_gallery', 
  'assets_photos', 
  'site_assets', 
  'highlight_banners'
));

-- 2.3 Authenticated Access (Update)
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id IN (
  'members_photos', 
  'event_banners', 
  'social_banners', 
  'social_projects_gallery', 
  'assets_photos', 
  'site_assets', 
  'highlight_banners'
));

-- 2.4 Authenticated Access (Delete)
CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id IN (
  'members_photos', 
  'event_banners', 
  'social_banners', 
  'social_projects_gallery', 
  'assets_photos', 
  'site_assets', 
  'highlight_banners'
));
