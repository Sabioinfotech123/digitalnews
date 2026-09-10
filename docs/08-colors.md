# Colors

## Confirmed palette (Red + White + Black only)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#D71920` | Primary buttons, active nav, breaking news, important actions |
| `--color-primary-hover` | darken of primary | Hover states |
| `--color-primary-light` | light tint | Soft highlights / backgrounds |
| `--color-black` | `#111111` | Navigation, footer, strong UI |
| `--color-white` | `#FFFFFF` | Cards, forms, main surfaces |
| `--color-background` | `#F7F7F7` | Page background |
| `--color-surface` | `#FFFFFF` | Elevated content surfaces |
| `--color-text` | `#171717` | Primary text / headlines |
| `--color-text-muted` | `#6B7280` | Secondary text |
| `--color-border` | `#E5E7EB` | Borders / dividers |

## Rules

- Do **not** use yellow in the primary theme.
- Do not make the entire site red or black.
- Never hard-code hex values in components — use tokens.
- Changing `--color-primary` must restyle the whole app.
