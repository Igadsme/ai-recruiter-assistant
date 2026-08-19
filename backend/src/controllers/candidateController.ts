import type { RequestHandler } from 'express'
import {
  activities,
  careerTimeline,
  education,
  experience,
  profile,
  projects,
  recruiterBrief,
  skills,
} from '../data/candidate/index.ts'
import { toProjectDeepDive } from '../services/recruiter.ts'
import { allSources, getSourceById } from '../services/retrieval.ts'
import { AppError } from '../types.ts'
import { projectIdParamSchema } from '../utils/validation.ts'

export const getHealth: RequestHandler = (_req, res) => {
  res.json({ status: 'ok' })
}

export const getProfile: RequestHandler = (_req, res) => {
  res.json({ profile, education })
}

export const getExperience: RequestHandler = (_req, res) => {
  res.json({ experience })
}

export const getProjects: RequestHandler = (_req, res) => {
  res.json({ projects })
}

export const getProjectById: RequestHandler = (req, res, next) => {
  try {
    const { id } = projectIdParamSchema.parse(req.params)
    const project = toProjectDeepDive(id)
    if (!project) throw new AppError(404, 'Project not found.', 'not_found')
    res.json({ project })
  } catch (error) {
    next(error)
  }
}

export const getSkills: RequestHandler = (_req, res) => {
  res.json({ skills, activities })
}

export const getBrief: RequestHandler = (_req, res) => {
  res.json({ brief: recruiterBrief })
}

export const getTimeline: RequestHandler = (_req, res) => {
  res.json({ timeline: careerTimeline })
}

export const getSources: RequestHandler = (_req, res) => {
  res.json({ sources: allSources() })
}

export const getSource: RequestHandler = (req, res, next) => {
  try {
    const id = decodeURIComponent(req.params.id ?? '')
    const source = getSourceById(id)
    if (!source) throw new AppError(404, 'Source not found.', 'not_found')
    res.json({ source })
  } catch (error) {
    next(error)
  }
}
