import type { Category } from '@/types/content'
import type { PublicNewsCardModel } from '@/utils/publicNews'

export type HomeCategoryBlock = {
  categoryName: string
  categorySlug: string
  articles: PublicNewsCardModel[]
}

export function attachCategorySlugs(
  cards: PublicNewsCardModel[],
  categories: Category[],
): PublicNewsCardModel[] {
  const byId = new Map(categories.map((c) => [c.id, c.slug]))
  const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.slug]))
  return cards.map((card) => {
    let slug = card.categoryId ? byId.get(card.categoryId) : undefined
    if (!slug) {
      slug = byName.get(card.category.trim().toLowerCase())
    }
    return slug ? { ...card, categorySlug: slug } : card
  })
}

/** Group feed into category blocks (Hindu-style section rails). */
export function buildHomeCategoryBlocks(
  pool: PublicNewsCardModel[],
  options?: { maxBlocks?: number; minPerBlock?: number; excludeIds?: Set<string> },
): HomeCategoryBlock[] {
  const maxBlocks = options?.maxBlocks ?? 3
  const minPerBlock = options?.minPerBlock ?? 1
  const exclude = options?.excludeIds ?? new Set<string>()
  const grouped = new Map<string, HomeCategoryBlock>()

  for (const article of pool) {
    if (exclude.has(article.id)) continue
    const key = article.categorySlug || article.category.trim().toLowerCase()
    if (!key) continue
    const existing = grouped.get(key)
    if (existing) {
      existing.articles.push(article)
    } else {
      grouped.set(key, {
        categoryName: article.category,
        categorySlug: article.categorySlug || key,
        articles: [article],
      })
    }
  }

  return [...grouped.values()]
    .sort((a, b) => b.articles.length - a.articles.length)
    .filter((block) => block.articles.length >= minPerBlock)
    .slice(0, maxBlocks)
}

export function pickHeadlineList(
  pool: PublicNewsCardModel[],
  limit: number,
  excludeIds: Set<string>,
): PublicNewsCardModel[] {
  const out: PublicNewsCardModel[] = []
  for (const item of pool) {
    if (excludeIds.has(item.id)) continue
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}
