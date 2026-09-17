# Frontend UI Workflow (Admin CMS)

Simple guide for **how to use the Admin UI** — not backend.

Open CMS:

```text
http://localhost:5173/admin/login
```

Default local login (if unchanged):

```text
Email: admin@example.com
Password: Admin@12345
```

---

## Golden rule (do this order)

```text
1) Catalog → Categories
2) Catalog → Tags
3) Breaking news (ticker)  — optional, anytime
4) News (by type)  OR  Blogs
```

**Why?**  
When you create news/blog, the form asks you to pick a **category** and **tags**.  
If those don’t exist yet, the UI shows a warning and dropdowns stay empty.

---

## Sidebar map (what each menu is)

| Menu | What you do there |
|------|-------------------|
| **Dashboard** | Counts / overview |
| **Breaking news** | Header ticker headlines (CRUD) |
| **Catalog → Categories** | Add/edit/delete categories |
| **Catalog → Tags** | Add/edit/delete tags |
| **News → All news** | See every news item |
| **News → Featured / Latest / Trending / More** | Manage that homepage section only |
| **Blogs** | Blog list + create/edit |
| **Users** | Admin user accounts |
| Header **Add** button | Quick shortcuts to create things |

---

## Step 1 — Add categories first

1. Sidebar → **Catalog** → **Categories**
2. Click **Add category**
3. Fill:
   - **Name** (example: Sports)
   - **Slug** (auto from name, or edit — example: `sports`)
   - Description (optional)
   - Active ON
4. Save

**Edit / Delete**
- Edit icon → change fields → Save  
- Delete icon → confirm → removed

> Tip: Create the main categories you’ll use on the site before writing news.

---

## Step 2 — Add tags second

1. Sidebar → **Catalog** → **Tags**
2. Click **Add tag**
3. Fill **Name** + **Slug**
4. Save

**Edit / Delete** same as categories.

> Tip: Tags are smaller labels (Cricket, Election, AI…). One news can have many tags.

---

## Step 2.5 — Breaking news ticker

Controls the red **BREAKING NEWS** bar under the public header.

1. Sidebar → **Breaking news**
2. Click **Add breaking news** (or header **Add** → Breaking news)
3. Fill:
   - **Title** — text that scrolls in the ticker
   - **Language** — English or తెలుగు (matches public language switcher)
   - **Link URL** (optional) — e.g. `/news/my-slug` or full URL
   - **Sort order** — lower numbers first
   - **Active** ON to show on the site
4. Save

**Public site:** only **active** items for the current language appear. If none are active, the ticker hides.

> Tip: This is **not** the same as the “Breaking” switch on a news article. That badge is for the article card/detail; this page feeds the header ticker.

**How to see if a link was added**
- Admin list → **Link** column shows a 🔗 icon. Click it → **Copy** or **Open**. Empty = no link.
- Public ticker → linked headlines are **underlined** and show a small external-link icon.

---

## Step 3 — News workflow

### 3A) Choose the news type (section)

News is split by homepage section:

| Menu | Shows on public site as |
|------|-------------------------|
| Featured news | Featured block |
| Latest news | Latest list |
| Trending news | Trending list |
| More news | More news list |
| All news | Everything together |

You can create from:
- that section’s page → **+ Create …**
- or header **Add** → Featured / Latest / Trending / More news

### 3B) Create news

1. Open the type page (example: **News → Latest**)
2. Click **+ Create …**
3. Fill the form:

| Field | Notes |
|-------|--------|
| Title | Required |
| Slug | Required (unique per language) |
| Short description | Summary |
| Content | Full article |
| **News image** | **Required** — upload first |
| News type | Locked if you came from Featured/Latest/…; from **All news** you can pick any type |

| Language | English / Telugu |
| Status | draft / published / … |
| Category | Pick from Catalog |
| Tags | Pick one or more |
| Breaking | Optional flag |
| SEO fields | Optional |

4. Click **Create news**

**After create:** you stay on edit page for that item (easy to fix and re-save).

### 3C) Edit news

1. Open list (All news or typed list)
2. Click **Edit** (pencil)
3. Change fields → **Save changes**

### 3D) Delete news

1. Click **Delete** (trash)
2. Confirm in popup
3. Item is removed from CMS lists (soft delete on backend)

### 3E) Useful list tools

- Search title/slug  
- Filter type / language / status  
- Sort columns  
- Refresh icon (bottom-left)  
- Views column = public open count  

---

## Step 4 — Blog workflow (same idea)

Blogs do **not** have Featured/Latest/Trending/More types.  
One list only: **Blogs**.

### Recommended order

```text
Categories + Tags ready  →  Blogs → Create / Edit / Delete
```

### Create blog

1. Sidebar → **Blogs**
2. **+ Create blog** (or header **Add → Blog**)
3. Fill title, slug, content, language, status, category, tags, cover image (optional), SEO
4. Create

### Edit / Delete

Same pattern as news: pencil / trash on the blog table.

---

## Full day-to-day flow (example)

```text
Morning setup (once)
  Catalog → add Categories (Sports, Tech…)
  Catalog → add Tags (Cricket, AI…)

Create today’s news
  News → Latest → Create
  Upload image → write content → pick category/tags → Publish

Create a blog
  Blogs → Create
  Write content → pick category/tags → Publish

Fix something
  Open list → Edit → Save

Remove old item
  Delete → Confirm
```

---

## Public site (what users see)

| Admin action | Public result |
|--------------|---------------|
| Publish Featured news | Home → Featured section |
| Publish Latest / Trending / More | Matching home sections |
| Publish Blog | `/blogs` list + detail |
| Open article on site | Increases **Views** in admin table |

Public URLs (local):

```text
http://localhost:5173/          Home
http://localhost:5173/news/...  News detail
http://localhost:5173/blogs     Blogs
http://localhost:5173/search    Search
```

---

## Quick “Add” menu (header)

Top-right **Add** shortcut:

- Category / Tag  
- Featured / Latest / Trending / More news  
- Blog  
- User  

Same create screens — just faster to open.

---

## Common mistakes

| Mistake | What happens | Fix |
|---------|--------------|-----|
| Create news before category/tag | Warning toast; empty dropdowns | Add Catalog items first |
| Skip news image | Form / API blocks create | Upload image first |
| Wrong news type page | Item appears in wrong home section | Create from correct type menu |
| Leave status = draft | Not visible on public site | Set status to **published** |
| Same slug + same language | Conflict error | Change slug |

---

## Checklist before publishing news

- [ ] Category exists  
- [ ] Tag(s) exist  
- [ ] Image uploaded  
- [ ] Correct news type (featured/latest/trending/more)  
- [ ] Correct language (en/te)  
- [ ] Status = published  
- [ ] Title + content filled  

## Checklist before publishing blog

- [ ] Category / tags ready  
- [ ] Title + content filled  
- [ ] Language + status set  
- [ ] Cover image (optional but recommended)  

---

## Related docs

- DB tables: [04-database.md](./04-database.md)
- API endpoints: [05-api-documentation.md](./05-api-documentation.md)
- Local run: [13-development-setup.md](./13-development-setup.md) · `Run.txt`
