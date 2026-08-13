import { activities } from './activities.ts'
import { education } from './education.ts'
import { experience } from './experience.ts'
import { profile } from './profile.ts'
import { projects } from './projects.ts'
import { skills } from './skills.ts'
import { story } from './story.ts'

export { activities, education, experience, profile, projects, skills, story }

export const candidateKnowledgeBase = {
  profile,
  education,
  experience,
  projects,
  skills,
  activities,
  story,
}

export function formatDateRange(start: string, end: string): string {
  return `${start} – ${end}`
}
