import { Router } from 'express'

import {
  createProductHandler,
  listProductsHandler,
  listProductsPaginatedHandler,
} from '../controllers/product.controller.js'

export const productRouter = Router()

productRouter.get('/page', listProductsPaginatedHandler)
productRouter.get('/', listProductsHandler)
productRouter.post('/', createProductHandler)
