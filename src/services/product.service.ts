import { HttpStatus } from '../constants/httpStatus.js'
import { prisma } from '../db/prisma.js'
import type { Product } from '../generated/prisma/index.js'
import {
  Prisma,
  ProductCategory,
} from '../generated/prisma/index.js'
import { ApiError } from '../utils/ApiError.js'

export interface CreateProductPayload {
  name?: unknown
  description?: unknown
  actualPrice?: unknown
  offerPrice?: unknown
  category?: unknown
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new ApiError(HttpStatus.BAD_REQUEST, `${label} must be a string`)
  }
  const s = value.trim()
  if (!s) {
    throw new ApiError(HttpStatus.BAD_REQUEST, `${label} cannot be empty`)
  }
  return s
}

function parseMoney(value: unknown, label: string): Prisma.Decimal {
  let n: number
  if (typeof value === 'number') {
    n = value
  } else if (typeof value === 'string') {
    n = Number.parseFloat(value.trim())
  } else {
    throw new ApiError(HttpStatus.BAD_REQUEST, `${label} must be a number`)
  }

  if (!Number.isFinite(n) || n < 0) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      `${label} must be a valid non-negative number`,
    )
  }

  return new Prisma.Decimal(String(n))
}

function parseOfferPrice(value: unknown): Prisma.Decimal | null {
  if (value === null || value === undefined) return null

  let n: number
  if (typeof value === 'number') {
    n = value
  } else if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return null
    n = Number.parseFloat(trimmed)
  } else {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'offerPrice must be a number or null',
    )
  }

  if (!Number.isFinite(n) || n < 0) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'offerPrice must be a valid non-negative number',
    )
  }

  return new Prisma.Decimal(String(n))
}

function parseCategory(value: unknown): ProductCategory {
  const raw =
    typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (!raw) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'category is required')
  }

  for (const candidate of Object.values(ProductCategory)) {
    if (candidate === raw) return candidate
  }

  const allowed = Object.values(ProductCategory).join(', ')
  throw new ApiError(
    HttpStatus.BAD_REQUEST,
    `Invalid category; use one of: ${allowed}`,
  )
}

/** Parse one category token (UPPER_SNAKE) into `ProductCategory`. */
function parseCategoryToken(token: string): ProductCategory {
  const raw = token.trim().toUpperCase()
  if (!raw) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Empty category in list')
  }
  for (const candidate of Object.values(ProductCategory)) {
    if (candidate === raw) return candidate
  }
  const allowed = Object.values(ProductCategory).join(', ')
  throw new ApiError(
    HttpStatus.BAD_REQUEST,
    `Invalid category "${raw}"; use one of: ${allowed}`,
  )
}

/**
 * Build category list from query: `?category=A&category=B` and/or
 * `?category=A,B,C`. Unknown values return 400.
 */
export function parseCategoriesFromQueryParam(
  categoryQuery: unknown,
): ProductCategory[] {
  if (categoryQuery === undefined) return []

  let chunks: string[]
  if (typeof categoryQuery === 'string') {
    chunks = categoryQuery.trim() === '' ? [] : [categoryQuery]
  } else if (Array.isArray(categoryQuery)) {
    chunks = categoryQuery.filter((c): c is string => typeof c === 'string')
  } else {
    return []
  }
  const tokens: string[] = []
  for (const chunk of chunks) {
    if (typeof chunk !== 'string' || chunk.trim() === '') continue
    for (const part of chunk.split(',')) {
      const t = part.trim()
      if (t) tokens.push(t)
    }
  }

  const seen = new Set<ProductCategory>()
  for (const t of tokens) {
    seen.add(parseCategoryToken(t))
  }
  return [...seen]
}

function parsePagedInt(
  raw: unknown,
  paramName: string,
  fallback: number,
  opts: { min: number; max?: number },
): number {
  if (raw === undefined || raw === '') return fallback

  const single = Array.isArray(raw) ? raw[0] : raw
  const n =
    typeof single === 'string'
      ? Number.parseInt(single, 10)
      : typeof single === 'number'
        ? Math.trunc(single)
        : Number.NaN

  if (!Number.isFinite(n) || n < opts.min) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      `${paramName} must be an integer greater than or equal to ${String(opts.min)}`,
    )
  }

  if (opts.max !== undefined && n > opts.max) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      `${paramName} cannot exceed ${String(opts.max)}`,
    )
  }

  return n
}

/** Query `page` (1-based), `limit` (page size); defaults page=1, limit=10, max limit=50. */
export function parsePaginationFromQuery(query: {
  page?: unknown
  limit?: unknown
}): { page: number; limit: number } {
  const limit = parsePagedInt(query.limit, 'limit', 10, {
    min: 1,
    max: 50,
  })
  const page = parsePagedInt(query.page, 'page', 1, { min: 1 })

  return { page, limit }
}

export function productToJson(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    actualPrice: product.actualPrice.toString(),
    offerPrice: product.offerPrice?.toString() ?? null,
    category: product.category,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

export async function createProduct(payload: CreateProductPayload) {
  const name = requireString(payload.name, 'name')
  const description = requireString(payload.description, 'description')
  const actualPrice = parseMoney(payload.actualPrice, 'actualPrice')
  const offerPrice = parseOfferPrice(payload.offerPrice)
  const category = parseCategory(payload.category)

  if (offerPrice !== null && offerPrice.gt(actualPrice)) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'offerPrice cannot exceed actualPrice',
    )
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      actualPrice,
      offerPrice,
      category,
    },
  })

  return productToJson(product)
}

export async function listProducts(filters: {
  categories: ProductCategory[]
}): Promise<ReturnType<typeof productToJson>[]> {
  const { categories } = filters

  const products = await prisma.product.findMany({
    where:
      categories.length > 0
        ? {
            category: { in: categories },
          }
        : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return products.map(productToJson)
}

export async function listProductsPaginated(params: {
  page: number
  limit: number
  categories: ProductCategory[]
}) {
  const { page, limit, categories } = params

  const where =
    categories.length > 0
      ? {
          category: { in: categories },
        }
      : undefined

  const skip = (page - 1) * limit

  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  return {
    products: rows.map(productToJson),
    page,
    limit,
    skip,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPreviousPage: page > 1,
  }
}
