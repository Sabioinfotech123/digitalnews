import type { PublicNewsCardModel } from '@/utils/publicNews'

/** Merge home feeds in priority order; first occurrence wins. */
export function mergeHomeNews(...groups: PublicNewsCardModel[][]): PublicNewsCardModel[] {
  const seen = new Set<string>()
  const out: PublicNewsCardModel[] = []
  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item)
    }
  }
  return out
}
