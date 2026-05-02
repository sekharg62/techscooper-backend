import { HttpStatus } from '../constants/httpStatus.js'
import type { UsersActivityDocument } from '../db/usersActivities.schema.js'
import { getUsersActivitiesCollection } from '../db/usersActivities.schema.js'
import { ApiError } from '../utils/ApiError.js'

function requireActivitiesCollection(): NonNullable<
  ReturnType<typeof getUsersActivitiesCollection>
> {
  const coll = getUsersActivitiesCollection()
  if (coll === null) {
    throw new ApiError(
      HttpStatus.SERVICE_UNAVAILABLE,
      'MongoDB is not connected; activity tracking is unavailable.',
    )
  }
  return coll
}

function requireUserId(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid payload: userId is required.')
  }
  return value.trim()
}

function normalizeCategoryToken(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'Category required for category_search.',
    )
  }
  return value.trim().toUpperCase()
}

function requireProductId(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'ProductId required for product_click.')
  }
  return value.trim()
}

function assertActivityType(raw: unknown): 'category_search' | 'product_click' {
  if (raw !== 'category_search' && raw !== 'product_click') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid payload: type must be category_search or product_click.')
  }
  return raw
}

export async function incrementCategorySearch(
  userId: string,
  category: string,
): Promise<void> {
  const coll = requireActivitiesCollection()
  const normalized = category.trim().toUpperCase()
  const now = new Date()

  const bumped = await coll.updateOne(
    { userId, 'category_searched.category': normalized },
    {
      $inc: { 'category_searched.$.count': 1 },
      $set: {
        'category_searched.$.lastUsedAt': now,
        updatedAt: now,
      },
    },
  )

  if (bumped.matchedCount > 0) return

  await coll.updateOne(
    { userId },
    {
      $push: {
        category_searched: {
          category: normalized,
          count: 1,
          lastUsedAt: now,
        },
      },
      $set: { updatedAt: now },
      $setOnInsert: {
        product_clicked: [],
        createdAt: now,
      },
    },
    { upsert: true },
  )
}

export async function incrementProductClick(
  userId: string,
  productId: string,
): Promise<void> {
  const coll = requireActivitiesCollection()
  const pid = productId.trim()
  const now = new Date()

  const bumped = await coll.updateOne(
    { userId, 'product_clicked.productId': pid },
    {
      $inc: { 'product_clicked.$.count': 1 },
      $set: {
        'product_clicked.$.lastClickedAt': now,
        updatedAt: now,
      },
    },
  )

  if (bumped.matchedCount > 0) return

  await coll.updateOne(
    { userId },
    {
      $push: {
        product_clicked: {
          productId: pid,
          count: 1,
          lastClickedAt: now,
        },
      },
      $set: { updatedAt: now },
      $setOnInsert: {
        category_searched: [],
        createdAt: now,
      },
    },
    { upsert: true },
  )
}

export async function recordActivity(body: Record<string, unknown>): Promise<void> {
  const userId = requireUserId(body.userId)
  const type = assertActivityType(body.type)

  if (type === 'category_search') {
    const category = normalizeCategoryToken(body.category)
    await incrementCategorySearch(userId, category)
    return
  }

  const productId = requireProductId(body.productId)
  await incrementProductClick(userId, productId)
}

export interface SerializedCategorySearchRow {
  category: string
  count: number
  lastUsedAt: string
}

export interface SerializedProductClickRow {
  productId: string
  count: number
  lastClickedAt: string
}

export interface SerializedUserActivities {
  userId: string
  category_searched: SerializedCategorySearchRow[]
  product_clicked: SerializedProductClickRow[]
  createdAt?: string
  updatedAt?: string
}

function serializeCategoryEntry(
  entry: NonNullable<
    UsersActivityDocument['category_searched']
  >[number],
): SerializedCategorySearchRow {
  const lastUsedAt =
    entry.lastUsedAt instanceof Date
      ? entry.lastUsedAt.toISOString()
      : String(entry.lastUsedAt)
  return {
    category: entry.category,
    count: entry.count,
    lastUsedAt,
  }
}

function serializeProductEntry(
  entry: NonNullable<
    UsersActivityDocument['product_clicked']
  >[number],
): SerializedProductClickRow {
  const lastClickedAt =
    entry.lastClickedAt instanceof Date
      ? entry.lastClickedAt.toISOString()
      : String(entry.lastClickedAt)
  return {
    productId: entry.productId,
    count: entry.count,
    lastClickedAt,
  }
}

/** Path segment: trimmed user UUID string from Postgres (decoded if URL-encoded). */
export function parseUserIdSegment(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid user id in URL.')
  }
  return decodeURIComponent(raw.trim())
}

/** One activity document for `userId`, or `null` when none exists in Mongo. */
export async function fetchUserActivities(
  userId: string,
): Promise<SerializedUserActivities | null> {
  const coll = requireActivitiesCollection()
  const id = userId.trim()
  const doc = await coll.findOne({ userId: id })

  if (doc === null) return null

  const cats = doc.category_searched ?? []
  const prods = doc.product_clicked ?? []

  const payload: SerializedUserActivities = {
    userId: doc.userId,
    category_searched: cats.map(serializeCategoryEntry),
    product_clicked: prods.map(serializeProductEntry),
  }

  if (doc.createdAt instanceof Date)
    payload.createdAt = doc.createdAt.toISOString()
  if (doc.updatedAt instanceof Date)
    payload.updatedAt = doc.updatedAt.toISOString()

  return payload
}
