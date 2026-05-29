-- 027_homepage_hero_video.sql
--
-- Adds two columns to `homepage_banners` so admins can configure the
-- homepage hero with a featured project (B4 in the client feedback backlog):
--
--   video_url               – optional MP4/WebM file URL served from the
--                             `homepage-banners` storage bucket. When set,
--                             the public hero renders this video over the
--                             existing image fallbacks.
--   linked_development_id   – optional FK to `developments(id)`. When set,
--                             the public hero overlay text is auto-derived
--                             from that development (project name, suburb,
--                             state, developer) and the hero links to
--                             `/listings/<development.slug>`. Falls back to
--                             the existing `title` + `link` columns when
--                             not set, so existing banners keep working.

ALTER TABLE public.homepage_banners
  ADD COLUMN IF NOT EXISTS video_url             text,
  ADD COLUMN IF NOT EXISTS linked_development_id uuid
    REFERENCES public.developments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS homepage_banners_linked_development_id_idx
  ON public.homepage_banners (linked_development_id);
