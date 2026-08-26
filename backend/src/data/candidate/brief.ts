import { education } from './education.ts'
import { experience } from './experience.ts'
import { profile } from './profile.ts'
import { projects } from './projects.ts'
import { skills } from './skills.ts'

export const recruiterBrief = {
  candidate: profile.name,
  title: profile.title,
  education: `${education.degree} — ${education.school}`,
  graduation: education.expectedGraduation,
  focus: ['AI', 'Software', 'Systems', 'Automation'],
  coreTechnologies: [
    'Java',
    'Python',
    'TypeScript',
    'JavaScript',
    'React',
    'Node.js',
    'Next.js',
    'PostgreSQL',
    'AWS',
    'Docker',
    'FastAPI',
    'Redis',
  ],
  relevantExperienceCount: experience.filter((role) => role.organization !== 'Lutheran Service School').length,
  relevantExperienceLabel: 'internships, a fellowship, and a co-op',
  aiProjectCount: projects.filter((project) => project.categories.includes('ai')).length,
  bestFitRoles: [
    'Software Engineer',
    'AI/ML Engineer',
    'Backend Engineer',
    'Full-Stack Engineer',
    'New Grad Software Engineer',
  ],
  availability: profile.availability,
  email: profile.email,
  phone: profile.phone,
  linkedin: profile.linkedin,
  github: `https://${profile.github}`,
  languages: [...skills.languages],
} as const
