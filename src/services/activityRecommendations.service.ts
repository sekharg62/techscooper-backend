import { prisma } from '../db/prisma.js'
import { ProductCategory } from '../generated/prisma/index.js'
import type { SerializedUserActivities } from './activity.service.js'
import { productToJson } from './product.service.js'
import {
  deriveUserPreferences,
  type UserDemographicProfile,
} from './userPreferencesFromActivity.js'

const PRODUCT_CATEGORY_SET = new Set<string>(Object.values(ProductCategory))

function isProductCategory(c: string): c is ProductCategory {
  return PRODUCT_CATEGORY_SET.has(c)
}

/** Max rows when loading products matching top interest categories (after clicks). */
const CATEGORY_PRODUCTS_CAP = 36

export type ProductJsonRow = ReturnType<typeof productToJson>

/** Public GET payload — merged recommendations only (`userId` comes from URL). */
export interface ActivityRecommendationsResponse {
  recommendedProducts: ProductJsonRow[]
}

/**
 * 1. Resolve top clicked product IDs from activity scores.
 * 2. Resolve top categories from activity scores → load other products in those categories.
 */
export async function hydrateActivityRecommendations(
  activities: SerializedUserActivities,
  demographics?: UserDemographicProfile | null,
): Promise<ActivityRecommendationsResponse> {
  const { topProducts, topCategories } = deriveUserPreferences(
    activities,
    demographics,
  )

  const prismaCategories = topCategories.filter(isProductCategory)

  const clicked =
    topProducts.length === 0
      ? []
      : await prisma.product.findMany({
          where: { id: { in: topProducts } },
        })

  const orderByClick = new Map(topProducts.map((id, idx) => [id, idx]))
  const topClickedProducts = [...clicked]
    .sort(
      (a, b) =>
        (orderByClick.get(a.id) ?? 0) - (orderByClick.get(b.id) ?? 0),
    )
    .map(productToJson)

  const clickedIdSet = new Set(topClickedProducts.map((p) => p.id))

  const categoryRows =
    prismaCategories.length === 0
      ? []
      : await prisma.product.findMany({
          where: {
            category: { in: prismaCategories },
            ...(clickedIdSet.size > 0
              ? { id: { notIn: [...clickedIdSet] } }
              : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: CATEGORY_PRODUCTS_CAP,
        })

  const topCategoryProducts = categoryRows.map(productToJson)

  return {
    recommendedProducts: [...topClickedProducts, ...topCategoryProducts],
  }
}
