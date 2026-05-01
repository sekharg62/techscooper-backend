import type { Request, Response } from 'express'

import { HttpStatus } from '../constants/httpStatus.js'
import {
  createProduct,
  listProducts,
  listProductsPaginated,
  parseCategoriesFromQueryParam,
  parsePaginationFromQuery,
} from '../services/product.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const createProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = await createProduct(req.body)
    res.status(HttpStatus.CREATED).json(body)
  },
)

/** Public GET paginated list — `GET /api/product/page?page=2&limit=10` (2nd page). */
export const listProductsPaginatedHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit } = parsePaginationFromQuery(req.query)
    const categories = parseCategoriesFromQueryParam(req.query.category)
    const body = await listProductsPaginated({ page, limit, categories })
    res.status(HttpStatus.OK).json(body)
  },
)

/** Public GET — filter by multiple categories via repeated or comma-separated `category`. */
export const listProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = parseCategoriesFromQueryParam(req.query.category)
    const products = await listProducts({ categories })
    res.status(HttpStatus.OK).json({ products })
  },
)
