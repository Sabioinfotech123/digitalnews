# Design System

## Goals

Modern, clean, trustworthy digital-media look. Soft shadows, subtle borders, moderate radius, generous whitespace. No excessive gradients or animations.

## Token categories

Defined in `frontend/src/styles/variables.scss`:

- Colors (see [08 Colors](./08-colors.md))
- Typography (see [09 Typography](./09-typography.md))
- Spacing: `--space-xs` … `--space-xl`
- Radius: `--radius-sm|md|lg`
- Shadows: `--shadow-sm|md|lg`
- Breakpoints & transitions

## Component layers

1. **Design tokens** — CSS variables only source of brand color/type
2. **App\* primitives** — AppButton, AppInput, AppCard, AppTable, …
3. **Content components** — NewsCard, BreakingNewsTicker, LanguageSwitcher, …
4. **Layouts** — Header, Footer, AdminLayout

Ant Design is the primary component library; theme it to match CSS variables (ConfigProvider).

## UX rules

- Cards: subtle shadow, not heavy elevation
- Buttons: soft professional primary red
- Mobile-first responsive behavior
- Accessible focus states and contrast
