# SEO Architecture

## Per-content fields

- `seo_title`, `seo_description`, `seo_keywords`
- SEO-friendly `slug` (e.g. `/news/andhra-pradesh-development-project`)
- Canonical URL
- Open Graph + Twitter/X meta
- Structured data where appropriate

## Language-aware SEO

- Public content filtered by language
- Prepare `hreflang` when translation links exist later
- `sitemap.xml` and `robots.txt` generation (Phase 10)

## SPA note

Phase 7+ may add prerender/SSR or meta injection strategy for crawlers. Architecture keeps SEO fields on content models from day one.
