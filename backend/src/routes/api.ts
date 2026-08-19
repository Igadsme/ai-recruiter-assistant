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
import { chatRateLimiter } from '../middleware/rateLimit.ts'

export const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.post('/chat', chatRateLimiter, postChat)
apiRouter.post('/conversations', postConversation)
apiRouter.get('/conversations/:id', getConversationById)
apiRouter.patch('/conversations/:id/session', patchConversationSession)
apiRouter.get('/candidate/profile', getProfile)
apiRouter.get('/candidate/experience', getExperience)
apiRouter.get('/candidate/projects', getProjects)
apiRouter.get('/candidate/projects/:id', getProjectById)
apiRouter.get('/candidate/skills', getSkills)
apiRouter.get('/candidate/brief', getBrief)
apiRouter.get('/candidate/timeline', getTimeline)
apiRouter.get('/candidate/sources', getSources)
apiRouter.get('/candidate/sources/:id', getSource)
apiRouter.post('/fit', chatRateLimiter, postFit)
apiRouter.get('/interview/tracks', getInterviewTracks)
apiRouter.post('/interview', chatRateLimiter, postInterview)
apiRouter.post('/analytics/events', postAnalyticsEvent)
apiRouter.get('/analytics', getAnalytics)
