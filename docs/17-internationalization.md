# Internationalization Architecture

## Supported languages

| Code | Language |
|------|----------|
| `en` | English (default UI) |
| `te` | Telugu |

Do **not** add Bengali.

## UI language vs content language

| Concern | Controls | Persistence |
|---------|----------|-------------|
| **UI language** | Nav, buttons, labels, validation, admin chrome | `localStorage` |
| **Content language** | News / blogs / videos records | DB `language` column; API `?language=` |

On the public site, UI language selection drives default content language (`en` → English content, `te` → Telugu content). Admin list filters can be All / EN / TE independently.

## Frontend catalogs

```
src/locales/
  en/ common.ts navigation.ts auth.ts news.ts admin.ts
  te/ common.ts navigation.ts auth.ts news.ts admin.ts
```

Usage: `t("navigation.home")`.

## Backend

- Enum/validation: only `en` | `te`
- Indexes on `(language, …)`
- Independent rows (not assumed translations)
- Optional future `translation_group_id`

## Typography

Telugu content uses Noto Sans Telugu (`--font-telugu`).

## LanguageSwitcher

Desktop header + mobile nav: `English | తెలుగు`.
