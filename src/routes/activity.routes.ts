import { Router } from 'express'

import {
  getUserActivitiesHandler,
  trackActivityHandler,
} from '../controllers/activity.controller.js'

export const activityRouter = Router()

activityRouter.post('/', trackActivityHandler)
activityRouter.get('/get-activities/:userId', getUserActivitiesHandler)
