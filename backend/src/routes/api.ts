import { Router } from 'express'
import { postChat } from '../controllers/chatController.ts'
import {
  getConversationById,
  patchConversationSession,
  postConversation,
} from '../controllers/conversationController.ts'
import {
  getBrief,
  getExperience,
  getHealth,
  getProfile,
  getProjectById,
  getProjects,
  getSkills,
  getSource,
  getSources,
  getTimeline,
} from '../controllers/candidateController.ts'
import {
  getAnalytics,
  getInterviewTracks,
  postAnalyticsEvent,
  postFit,
  postInterview,
} from '../controllers/recruiterController.ts'
import {
  analyticsRateLimiter,
  chatRateLimiter,
  fitRateLimiter,
  generalRateLimiter,
} from '../middleware/rateLimit.ts'

export const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.post('/chat', chatRateLimiter, postChat)
apiRouter.post('/conversations', generalRateLimiter, postConversation)
apiRouter.get('/conversations/:id', generalRateLimiter, getConversationById)
apiRouter.patch('/conversations/:id/session', generalRateLimiter, patchConversationSession)
apiRouter.get('/candidate/profile', generalRateLimiter, getProfile)
apiRouter.get('/candidate/experience', generalRateLimiter, getExperience)
apiRouter.get('/candidate/projects', generalRateLimiter, getProjects)
apiRouter.get('/candidate/projects/:id', generalRateLimiter, getProjectById)
apiRouter.get('/candidate/skills', generalRateLimiter, getSkills)
apiRouter.get('/candidate/brief', generalRateLimiter, getBrief)
apiRouter.get('/candidate/timeline', generalRateLimiter, getTimeline)
apiRouter.get('/candidate/sources', generalRateLimiter, getSources)
apiRouter.get('/candidate/sources/:id', generalRateLimiter, getSource)
apiRouter.post('/fit', fitRateLimiter, postFit)
apiRouter.get('/interview/tracks', generalRateLimiter, getInterviewTracks)
apiRouter.post('/interview', chatRateLimiter, postInterview)
apiRouter.post('/analytics/events', analyticsRateLimiter, postAnalyticsEvent)
apiRouter.get('/analytics', analyticsRateLimiter, getAnalytics)
