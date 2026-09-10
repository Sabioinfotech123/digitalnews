# Styling Stack

## Confirmed mix

| Layer | Tool | Role |
|-------|------|------|
| Components | **Ant Design** | Forms, tables, drawers, admin UI |
| Utilities | **Tailwind CSS v4** | Layout, spacing, responsive helpers |
| Tokens | **SCSS variables** + Tailwind `@theme` | Red / White / Black brand |
| Icons | **Font Awesome** (`<i className="fa-solid …">`) | Solid, regular, brands via CSS |

Tailwind preflight is **disabled** so Ant Design is not reset.

## Icons

Use class-based Font Awesome (not React SVG components):

```tsx
<i className="fa-solid fa-magnifying-glass" aria-hidden />
<i className="fa-brands fa-youtube" aria-hidden />
<i className="fa-regular fa-heart" aria-hidden />
```

CSS is loaded once in `App.tsx` from `@fortawesome/fontawesome-free/css/all.min.css`.

## Brand Tailwind colors

- `bg-primary` / `text-primary` / `border-primary`
- `bg-ink` / `text-ink` / `bg-paper` / `bg-canvas`
- `font-heading` / `font-body` / `font-ui` / `font-telugu`

## Buttons

```tsx
import { AppButton } from '@/components/common/AppButton'
import { cn } from '@/utils/cn'

<AppButton type="primary" icon={<i className="fa-solid fa-play" aria-hidden />}>
  Play
</AppButton>
```
