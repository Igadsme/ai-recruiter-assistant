import { activities } from './activities.ts'
import { recruiterBrief } from './brief.ts'
import { differentiators } from './differentiators.ts'
import { education } from './education.ts'
import { experience } from './experience.ts'
import { interviewBank, interviewTracks } from './interviewBank.ts'
import { profile } from './profile.ts'
import { projects } from './projects.ts'
import { skills } from './skills.ts'
import { story } from './story.ts'
import { careerTimeline } from './timeline.ts'

export {
  activities,
  careerTimeline,
  differentiators,
  education,
  experience,
  interviewBank,
  interviewTracks,
  profile,
  projects,
  recruiterBrief,
  skills,
  story,
}

export const candidateKnowledgeBase = {
  profile,
  education,
  experience,
  projects,
  skills,
  activities,
  story,
  recruiterBrief,
  differentiators,
  careerTimeline,
}

export function formatDateRange(start: string, end: string): string {
  return `${start} – ${end}`
}
