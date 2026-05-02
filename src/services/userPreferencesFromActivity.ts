import type { Gender } from '../generated/prisma/index.js'
import type {
  SerializedCategorySearchRow,
  SerializedUserActivities,
} from './activity.service.js'
import { demographicCategoryScoreBonus } from './demographicCategoryWeights.js'

/** From `User` (Postgres). Omitted or all-null → behaviour-only ranking. */
export interface UserDemographicProfile {
  gender: Gender | null
  age: number | null
}

export interface UserPreferencesResult {
  topCategories: string[]
  topProducts: string[]
}

/** Minutes from timestamp string → now (`nowMs`). Invalid dates → ∞ so recency scores stay safe. */
function minutesSince(nowMs: number, isoOrString: string): number {
  const t = new Date(isoOrString).getTime()
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY
  return (nowMs - t) / (1000 * 60)
}

/**
 * From raw activity: top 3 categories and top 5 products using count + recency
 * (same formula as client script), plus optional small category boosts from `demographics`.
 */
export function deriveUserPreferences(
  activity: SerializedUserActivities,
  demographics?: UserDemographicProfile | null,
): UserPreferencesResult {
  const nowMs = Date.now()

  const categoryScores = activity.category_searched.map(
    (cat: SerializedCategorySearchRow) => {
      const timeDiff = minutesSince(nowMs, cat.lastUsedAt)
      const recencyScore = Math.max(0, 1000 - timeDiff)
      const demo =
        demographics == null
          ? 0
          : demographicCategoryScoreBonus(
              cat.category,
              demographics.gender,
              demographics.age,
            )
      const score = cat.count * 10 + recencyScore + demo

      return { category: cat.category, score }
    },
  )

  const topCategories = categoryScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => c.category)

  const productMap: Record<
    string,
    { count: number; lastClickedAt: string }
  > = {}

  for (const p of activity.product_clicked) {
    let agg = productMap[p.productId]
    if (agg === undefined) {
      agg = {
        count: 0,
        lastClickedAt: p.lastClickedAt,
      }
      productMap[p.productId] = agg
    }

    agg.count += p.count

    if (
      new Date(p.lastClickedAt).getTime() >
      new Date(agg.lastClickedAt).getTime()
    ) {
      agg.lastClickedAt = p.lastClickedAt
    }
  }

  const productScores = Object.entries(productMap).map(
    ([productId, data]) => {
      const timeDiff = minutesSince(nowMs, data.lastClickedAt)
      const recencyScore = Math.max(0, 1000 - timeDiff)

      const score = data.count * 20 + recencyScore

      return { productId, score }
    },
  )

  const topProducts = productScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((p) => p.productId)

  return {
    topCategories,
    topProducts,
  }
}
