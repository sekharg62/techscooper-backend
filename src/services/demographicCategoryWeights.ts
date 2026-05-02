import type { Gender } from '../generated/prisma/index.js'

/**
 * Optional soft priors for `deriveUserPreferences` category ranking.
 * Keep values modest vs behaviour (count×10 + recency up to ~1000) so clicks/searches win.
 * Tune from analytics or replace with materialized cohort scores later.
 */
export type AgeBand = 'CHILD' | 'TEEN' | 'YOUNG' | 'MID' | 'SENIOR'

export function ageToBand(age: number | null | undefined): AgeBand | null {
  if (age == null || !Number.isFinite(age) || age < 0) return null
  if (age < 13) return 'CHILD'
  if (age < 18) return 'TEEN'
  if (age < 35) return 'YOUNG'
  if (age < 55) return 'MID'
  return 'SENIOR'
}

/** Category token must match `ProductCategory` / activity normalisation (uppercase). */
type CategoryKey = string

const GENDER_CATEGORY_BOOST: Partial<
  Record<Gender, Partial<Record<CategoryKey, number>>>
> = {
  MALE: {
    GAMES: 40,
    AUTOMOTIVE: 35,
    ELECTRONICS: 25,
    SPORTS: 30,
    FITNESS: 30,
    SOFTWARE: 25,
    LAPTOP: 20,
    MOBILE: 22,
  },
  FEMALE: {
    BEAUTY: 40,
    CLOTHING: 30,
    FASHION_ACCESSORIES: 35,
    JEWELRY: 28,
    PERSONAL_CARE: 28,
    HOME_DECOR: 22,
    FOOTWEAR: 20,
  },
  OTHER: {},
}

const AGE_BAND_CATEGORY_BOOST: Partial<
  Record<AgeBand, Partial<Record<CategoryKey, number>>>
> = {
  CHILD: { TOYS: 45, GAMES: 40, BOOKS: 25, BABY_PRODUCTS: 35, STATIONERY: 18 },
  TEEN: { GAMES: 35, MOBILE: 32, BOOKS: 22, ACCESSORIES: 18, CLOTHING: 20 },
  YOUNG: {
    MOBILE: 28,
    LAPTOP: 24,
    CLOTHING: 22,
    FITNESS: 24,
    TRAVEL: 18,
    BEAUTY: 20,
  },
  MID: {
    HOME: 22,
    KITCHEN: 22,
    APPLIANCES: 24,
    HEALTH: 20,
    OFFICE_SUPPLIES: 18,
    AUTOMOTIVE: 20,
  },
  SENIOR: {
    HEALTH: 28,
    MEDICAL: 24,
    HOME: 22,
    BOOKS: 18,
    GROCERY: 16,
  },
}

export function demographicCategoryScoreBonus(
  categoryUpper: string,
  gender: Gender | null | undefined,
  age: number | null | undefined,
): number {
  let bonus = 0
  if (gender != null) {
    bonus += GENDER_CATEGORY_BOOST[gender]?.[categoryUpper] ?? 0
  }
  const band = ageToBand(age ?? null)
  if (band != null) {
    bonus += AGE_BAND_CATEGORY_BOOST[band]?.[categoryUpper] ?? 0
  }
  return bonus
}
