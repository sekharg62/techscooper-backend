import type { Request, Response } from 'express'

import { HttpStatus } from '../constants/httpStatus.js'
import { prisma } from '../db/prisma.js'
import {
  fetchUserActivities,
  parseUserIdSegment,
  recordActivity,
} from '../services/activity.service.js'
import { hydrateActivityRecommendations } from '../services/activityRecommendations.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

export const trackActivityHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await recordActivity(req.body as Record<string, unknown>)
    res.status(HttpStatus.OK).json({ message: 'Activity tracked' })
  },
)

export const getUserActivitiesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = parseUserIdSegment(req.params.userId)
    const activities = await fetchUserActivities(userId)
    if (activities === null) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'No activity found for this user.')
    }
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true, age: true },
    })
    const demographics =
      profile === null
        ? null
        : { gender: profile.gender, age: profile.age }
    const payload = await hydrateActivityRecommendations(
      activities,
      demographics,
    )
    res.status(HttpStatus.OK).json(payload)
  },
)
