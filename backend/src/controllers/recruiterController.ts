import type { RequestHandler } from 'express'
import { analyzeFit } from '../services/fit.ts'
import { handleInterview, interviewTracks } from '../services/interview.ts'
import { analyticsSummary, trackEvent, type AnalyticsEventType } from '../services/analytics.ts'
import { recordRetrievalOnSession } from '../services/conversation.ts'
import { retrieveCandidateContext } from '../services/retrieval.ts'
import { config } from '../config.ts'
import { AppError } from '../types.ts'
import { analyticsEventSchema, fitRequestSchema, interviewRequestSchema } from '../utils/validation.ts'
import { detectPromptInjection, wrapUntrustedData } from '../services/security.ts'
import { metricsSnapshot } from '../services/metrics.ts'

export const postFit: RequestHandler = (req, res, next) => {
  try {
    const body = fitRequestSchema.parse(req.body)
    if (detectPromptInjection(body.jobDescription)) {
      throw new AppError(400, 'Job description looks like an instruction override.', 'untrusted_input')
    }
    wrapUntrustedData('job description', body.jobDescription)
    const analysis = analyzeFit(body.jobDescription)
    trackEvent({ type: 'fit_analyzed', conversationId: body.conversationId })
    if (body.conversationId) {
      const retrieval = retrieveCandidateContext(body.jobDescription.slice(0, 400))
      recordRetrievalOnSession(body.conversationId, retrieval.sources, 'job description fit')
    }
    res.json({ analysis })
  } catch (error) {
    next(error)
  }
}

export const getInterviewTracks: RequestHandler = (_req, res) => {
  res.json({ tracks: interviewTracks })
}

export const postInterview: RequestHandler = async (req, res, next) => {
  try {
    const body = interviewRequestSchema.parse(req.body)
    const result = await handleInterview({
      track: body.track as Parameters<typeof handleInterview>[0]['track'],
      message: body.message,
      conversationId: body.conversationId,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const postAnalyticsEvent: RequestHandler = (req, res, next) => {
  try {
    const body = analyticsEventSchema.parse(req.body)
    const event = trackEvent({
      type: body.type as AnalyticsEventType,
      query: body.query,
      conversationId: body.conversationId,
    })
    res.status(201).json({ ok: true, at: event.at })
  } catch (error) {
    next(error)
  }
}

export const getAnalytics: RequestHandler = (req, res, next) => {
  try {
    const provided = String(req.header('x-analytics-key') ?? req.query.key ?? '')
    if (!config.analyticsKey || provided !== config.analyticsKey) {
      throw new AppError(401, 'Analytics access denied.', 'unauthorized')
    }
    res.json({ ...analyticsSummary(), observability: metricsSnapshot() })
  } catch (error) {
    next(error)
  }
}
