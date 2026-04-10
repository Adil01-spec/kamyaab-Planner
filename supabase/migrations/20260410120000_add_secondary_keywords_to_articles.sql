-- Secondary keywords for SEO (comma-separated in UI, stored as text array like tags)
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}';
