# Typography

## Font roles

| Role | Family | CSS token | Weights |
|------|--------|-----------|---------|
| Headings / news titles | Montserrat | `--font-heading` | 600, 700 |
| Body / descriptions | DM Sans | `--font-body` | 400, 500, 600 |
| UI (buttons, labels, nav) | Public Sans | `--font-ui` | 400, 500, 600 |
| Telugu content | Noto Sans Telugu | `--font-telugu` | 400, 500, 600, 700 |

Loaded via Google Fonts. No Bengali font/language support.

## Application

- English UI/content: heading/body/ui fonts as above
- Telugu content blocks: apply `--font-telugu` (and `lang="te"` where appropriate)
- Mixed EN+TE must render correctly without clipping

Do not hard-code `font-family` strings throughout components.
