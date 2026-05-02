/**
 * MongoDB collection: `users_activities`
 *
 * One document per Supabase user (`userId` = Postgres/Prisma `User.id` UUID string).
 *
 * Recommended index (when you persist data): `{ userId: 1 }` unique.
 */

import type { Collection } from 'mongodb'

import { getMongoDb } from './mongo.js'

export const USERS_ACTIVITIES_COLLECTION_NAME = 'users_activities' as const

/** Single bucket of category-search behaviour for a user. */
export interface UsersActivityCategorySearched {
  category: string
  count: number
  lastUsedAt: Date
}

/** Single bucket of product-click behaviour for a user. */
export interface UsersActivityProductClicked {
  /** Product id from Supabase / Prisma (`Product.id` UUID). */
  productId: string
  count: number
  lastClickedAt: Date
}

/**
 * Document shape stored in `users_activities`.
 * Field names match your desired payload (`category_searched`, `product_clicked`).
 */
export interface UsersActivityDocument {
  /** Supabase/Postgres user id (UUID string). */
  userId: string
  category_searched?: UsersActivityCategorySearched[]
  product_clicked?: UsersActivityProductClicked[]
  createdAt?: Date
  updatedAt?: Date
}

/** Typed handle to the collection (null when MongoDB is not connected). */
export function getUsersActivitiesCollection(
  dbName?: string,
): Collection<UsersActivityDocument> | null {
  const db = getMongoDb(dbName)
  if (db === null) return null
  return db.collection<UsersActivityDocument>(USERS_ACTIVITIES_COLLECTION_NAME)
}
