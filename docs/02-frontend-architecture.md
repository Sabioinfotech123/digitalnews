# Frontend Architecture

## Approach

Feature-based SPA served by Vite. Public site and admin CMS share one React app with route-based code splitting.

## Directory structure

```
frontend/src/
├── app/                    # App shell, router, providers
│   ├── router/
│   ├── providers/
│   └── store/              # Minimal auth/UI context (not Redux-by-default)
├── components/
│   ├── common/             # AppButton, AppCard, AppTable, …
│   ├── layout/             # Header, Footer, AdminLayout, …
│   └── ui/                 # Thin Ant Design wrappers if needed
├── features/
│   ├── auth/
│   ├── news/
│   ├── blogs/
│   ├── videos/
│   ├── categories/
│   ├── tags/
│   ├── search/
│   ├── bookmarks/
│   ├── profile/
│   └── admin/
├── pages/
│   ├── public/
│   └── admin/
├── hooks/
├── services/               # Domain services (compose API clients)
├── api/                    # Axios instance + endpoint modules
├── utils/
├── constants/
├── config/                 # brand.ts, env, feature flags
├── locales/
│   ├── en/
│   └── te/
├── types/
├── assets/
└── styles/
    ├── variables.scss
    ├── typography.scss
    ├── global.scss
    ├── components.scss
    └── responsive.scss
```

## Separation of concerns

| Concern | Location |
|---------|----------|
| UI | `components/`, `pages/` |
| Business logic | `features/*/`, `services/` |
| HTTP | `api/` |
| Types | `types/` |
| Copy / i18n | `locales/` + `t()` helper |
| Design tokens | `styles/variables.scss` |

Do **not** call Axios directly from presentational components.

## State management

- Local UI state: React `useState` / controlled Ant Design forms.
- Auth session: React Context (access/refresh tokens, user, role).
- Server state: lightweight approach (React Query optional later); keep global store minimal.
- UI language: Context + `localStorage`.
- Content language filter: derived from UI language on public pages; explicit admin filter.

## Routing (planned)

**Public:** `/`, `/today-news`, `/news`, `/news/:slug`, `/blogs`, `/blogs/:slug`, `/videos`, `/videos/:slug`, `/category/:slug`, `/search`, `/login`, `/register`, `/profile`, `/bookmarks`, `*`

**Admin:** `/admin/login`, `/admin`, `/admin/news`, `/admin/news/create`, `/admin/news/edit/:id`, (blogs/videos mirrors), `/admin/categories`, `/admin/tags`, `/admin/media`, `/admin/users`, `/admin/settings`, `/admin/profile`

## Design system

See [07 Design system](./07-design-system.md), [08 Colors](./08-colors.md), [09 Typography](./09-typography.md).

## Brand

All product name/logo usage reads from `config/brand.ts`. Never hard-code "NEWS" in Header/Footer/SEO titles.
