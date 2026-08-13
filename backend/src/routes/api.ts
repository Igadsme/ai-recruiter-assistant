import { Router } from 'express'
import { postChat } from '../controllers/chatController.ts'
import { getConversationById, postConversation } from '../controllers/conversationController.ts'
import { getExperience, getHealth, getProfile, getProjects, getSkills } from '../controllers/candidateController.ts'
import { chatRateLimiter } from '../middleware/rateLimit.ts'

export const apiRouter = Router()

apiRouter.get('/health', getHealth)
apiRouter.post('/chat', chatRateLimiter, postChat)
apiRouter.post('/conversations', postConversation)
apiRouter.get('/conversations/:id', getConversationById)
apiRouter.get('/candidate/profile', getProfile)
apiRouter.get('/candidate/experience', getExperience)
apiRouter.get('/candidate/projects', getProjects)
apiRouter.get('/candidate/skills', getSkills)
