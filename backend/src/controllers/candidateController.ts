import type { RequestHandler } from 'express'
import {
  activities,
  education,
  experience,
  profile,
  projects,
  skills,
} from '../data/candidate/index.ts'

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

export const getSkills: RequestHandler = (_req, res) => {
  res.json({ skills, activities })
}
