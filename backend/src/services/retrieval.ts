import {
  activities,
  education,
  experience,
  formatDateRange,
  profile,
  projects,
  skills,
  story,
} from '../data/candidate/index.ts'
import type { CandidateCategory, Source } from '../types.ts'

const AI_KEYWORDS =
  /\b(ai|artificial intelligence|machine learning|\bml\b|llm|gpt|rag|embedding|pinecone|gemini|openai|yolo|computer vision|vector|semantic search)\b/i
const CYBER_KEYWORDS =
  /\b(cyber|security|sentinel|kql|palo alto|siem|syslog|cef|firewall|log analytics)\b/i
const PROJECT_KEYWORDS =
  /\b(project|built|build|created|developed|devdash|camera|saas|portfolio)\b/i
const EXPERIENCE_KEYWORDS =
  /\b(experience|intern|internship|co-?op|work|role|job|career|software engineering|wellstar|shaw|upcancer|truespice|headstarter|lutheran)\b/i
const SKILL_KEYWORDS =
  /\b(skill|stack|languages?|frameworks?|tools?|technolog|proficien|python|typescript|react|next\.js)\b/i
const EDUCATION_KEYWORDS =
  /\b(education|school|university|degree|coursework|graduat|kennesaw|\bksu\b|computer science)\b/i
const ACTIVITY_KEYWORDS =
  /\b(hackathon|ieee|shpe|colorstack|club|activit|community|leadership|mentor)\b/i
const STORY_KEYWORDS =
  /\b(story|background|born|rwanda|congo|congolese|immigrant|moved|personal|who is|about|life|grew up|childhood|family|journey|motivation|why did|how did you|get into|personality|who are you|swahili|kinyarwanda|hobby|hobbies|gym|soccer|music|driving)\b/i
const RESUME_KEYWORDS = /\b(resume|cv|download|pdf|document)\b/i
const OVERVIEW_KEYWORDS =
  /\b(tell me about|overview|introduce|introduction|who is|60.second|summary)\b/i

export function analyzeQuery(query: string): CandidateCategory[] {
  const categories = new Set<CandidateCategory>()

  if (RESUME_KEYWORDS.test(query)) categories.add('resume')
  if (AI_KEYWORDS.test(query)) categories.add('ai')
  if (CYBER_KEYWORDS.test(query)) categories.add('cybersecurity')
  if (PROJECT_KEYWORDS.test(query)) categories.add('projects')
  if (
    EXPERIENCE_KEYWORDS.test(query) &&
    !AI_KEYWORDS.test(query) &&
    !CYBER_KEYWORDS.test(query) &&
    !PROJECT_KEYWORDS.test(query)
  ) {
    categories.add('experience')
  }
  if (SKILL_KEYWORDS.test(query) && !AI_KEYWORDS.test(query)) categories.add('skills')
  if (EDUCATION_KEYWORDS.test(query)) categories.add('education')
  if (ACTIVITY_KEYWORDS.test(query)) categories.add('activities')
  if (STORY_KEYWORDS.test(query) || OVERVIEW_KEYWORDS.test(query)) {
    categories.add('story')
    categories.add('profile')
  }

  if (categories.size === 0) {
    categories.add('profile')
    categories.add('experience')
    categories.add('skills')
  }

  return [...categories]
}

export function retrieveCandidateContext(query: string): {
  categories: CandidateCategory[]
  context: string
  sources: Source[]
} {
  const categories = analyzeQuery(query)
  const sections: string[] = []
  const sources: Source[] = []
  const seen = new Set<string>()

  const addSource = (source: Source) => {
    const key = `${source.type}:${source.title}:${source.organization ?? ''}`
    if (seen.has(key)) return
    seen.add(key)
    sources.push(source)
  }

  const include = (category: CandidateCategory) => categories.includes(category)
  const wantsOverview = include('profile') || include('resume')
  const wantsAi = include('ai')
  const wantsCyber = include('cybersecurity')

  if (wantsOverview || include('education') || include('resume')) {
    sections.push(formatEducation())
    addSource({
      type: 'education',
      title: education.degree,
      organization: education.school,
      date: `Expected ${education.expectedGraduation}`,
      relevantExcerpt: `Relevant coursework: ${education.coursework.join(', ')}.`,
    })
  }

  if (wantsOverview) {
    sections.push(
      `PROFILE\nName: ${profile.name}\nTitle: ${profile.title}\nAvailability: ${profile.availability}`,
    )
  }

  const relevantExperience = experience.filter((role) => {
    if (include('experience') || include('resume') || wantsOverview) {
      if (wantsAi && !wantsOverview && !include('experience')) {
        return role.categories.includes('ai')
      }
      if (wantsCyber && !wantsOverview && !include('experience')) {
        return role.categories.includes('cybersecurity')
      }
      return true
    }
    if (wantsAi) return role.categories.includes('ai')
    if (wantsCyber) return role.categories.includes('cybersecurity')
    return false
  })

  if (wantsAi && !include('experience') && !wantsOverview && !include('resume')) {
    const aiRoles = experience.filter((role) => role.categories.includes('ai'))
    for (const role of aiRoles) {
      if (!relevantExperience.includes(role)) relevantExperience.push(role)
    }
  }

  if (relevantExperience.length > 0) {
    sections.push('PROFESSIONAL EXPERIENCE (jobs, internships, fellowships, co-ops — not projects)')
    for (const role of relevantExperience) {
      sections.push(formatExperience(role))
      addSource({
        type: 'experience',
        title: role.role,
        organization: role.organization,
        date: formatDateRange(role.start, role.end),
        technologies: [...role.technologies],
        metrics: role.metrics.length > 0 ? [...role.metrics] : undefined,
        relevantExcerpt: role.bullets.join(' '),
      })
    }
  }

  const relevantProjects = projects.filter((project) => {
    if (include('projects') || include('resume') || wantsOverview) return true
    if (wantsAi) return project.categories.includes('ai')
    return false
  })

  if (wantsAi && !include('projects')) {
    for (const project of projects.filter((item) => item.categories.includes('ai'))) {
      if (!relevantProjects.includes(project)) relevantProjects.push(project)
    }
  }

  if (relevantProjects.length > 0) {
    sections.push('PROJECTS (personal/independent work — not professional employment)')
    for (const project of relevantProjects) {
      sections.push(formatProject(project))
      addSource({
        type: 'project',
        title: project.title,
        organization: project.subtitle,
        date: formatDateRange(project.start, project.end),
        technologies: [...project.technologies],
        metrics: project.metrics.length > 0 ? [...project.metrics] : undefined,
        relevantExcerpt: project.bullets.join(' '),
      })
    }
  }

  if (include('skills') || include('resume') || wantsAi || wantsOverview) {
    sections.push(formatSkills(wantsAi))
    addSource({
      type: 'skill',
      title: wantsAi ? 'AI and software skills' : 'Technical skills',
      technologies: wantsAi
        ? ['Python', 'PyTorch', 'TensorFlow', 'Pinecone', 'Gemini API', 'RAG']
        : [...skills.languages.slice(0, 6), ...skills.frameworks.slice(0, 6)],
      relevantExcerpt: wantsAi
        ? 'AI-related skills from verified data: Python, PyTorch, TensorFlow, NumPy, plus RAG/Pinecone/Gemini API experience from Headstarter AI and project work.'
        : `Languages: ${skills.languages.join(', ')}. Frameworks: ${skills.frameworks.join(', ')}.`,
    })
  }

  if (include('activities') || include('resume') || wantsOverview) {
    sections.push(
      [
        'ACTIVITIES',
        `Organizations: ${activities.organizations.join(', ')}`,
        `Hackathons: ${activities.hackathons.participations} participations, ${activities.hackathons.wins} wins.`,
        `In Imani's words: ${activities.hackathons.note}`,
      ].join('\n'),
    )
    addSource({
      type: 'activity',
      title: 'Student organizations and hackathons',
      metrics: [
        `${activities.hackathons.wins} hackathon wins`,
        `${activities.hackathons.participations} hackathon participations`,
      ],
      relevantExcerpt: `Member of ${activities.organizations.join(', ')}.`,
    })
  }

  sections.push(
    [
      'HOW IMANI TALKS',
      'Answer in first person as Imani. Sound like a person, not a resume. Use the personal story below whenever origin, motivation, teaching, or "who are you" is relevant.',
    ].join('\n'),
  )

  if (include('story') || wantsOverview) {
    sections.push(
      [
        "PERSONAL STORY (in Imani's words — use this voice and these facts)",
        story.inHisWords,
        '',
        `Languages at home: ${story.languagesAtHome.join(', ')}`,
        `Outside of software: ${story.hobbies.join('; ')}.`,
        `How I work: ${story.team}`,
        `What I am tired of people assuming: ${story.assumption}`,
      ].join('\n'),
    )
    addSource({
      type: 'story',
      title: 'Personal background',
      date: `Moved to the United States in ${story.movedToUnitedStates}`,
      relevantExcerpt: story.summary,
    })
  }

  return {
    categories,
    context: sections.join('\n\n'),
    sources,
  }
}

function formatEducation(): string {
  return [
    'EDUCATION',
    `${education.degree}, ${education.school}`,
    `Expected graduation: ${education.expectedGraduation}`,
    `Relevant coursework: ${education.coursework.join(', ')}`,
  ].join('\n')
}

function formatExperience(role: (typeof experience)[number]): string {
  return [
    `${role.role} — ${role.organization} (${formatDateRange(role.start, role.end)})`,
    role.why ? `Why I took this: ${role.why}` : '',
    role.memory ? `A moment I still remember: ${role.memory}` : '',
    ...role.bullets.map((bullet) => `- ${bullet}`),
    `Technologies: ${role.technologies.join(', ')}`,
    role.metrics.length > 0 ? `Metrics: ${role.metrics.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function formatProject(project: (typeof projects)[number]): string {
  return [
    `${project.title} — ${project.subtitle} (${formatDateRange(project.start, project.end)})`,
    ...project.bullets.map((bullet) => `- ${bullet}`),
    `Technologies: ${project.technologies.join(', ')}`,
    project.metrics.length > 0 ? `Metrics: ${project.metrics.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function formatSkills(aiFocused: boolean): string {
  if (aiFocused) {
    return [
      'TECHNICAL SKILLS (AI-relevant subset plus core languages)',
      `Languages: ${skills.languages.join(', ')}`,
      `AI/ML libraries: PyTorch, NumPy, TensorFlow`,
      'Do not claim PyTorch or TensorFlow were used in a specific job unless that job lists them.',
    ].join('\n')
  }

  return [
    'TECHNICAL SKILLS',
    `Languages: ${skills.languages.join(', ')}`,
    `Frameworks/Libraries: ${skills.frameworks.join(', ')}`,
    `Tools: ${skills.tools.join(', ')}`,
    `Project management: ${skills.projectManagement.join(', ')}`,
    `Operating systems: ${skills.operatingSystems.join(', ')}`,
  ].join('\n')
}

export function isResumeQuery(query: string): boolean {
  return RESUME_KEYWORDS.test(query)
}

export function isEvidenceQuery(query: string): boolean {
  return /\b(evidence|sources?|proof|cite|citations?|show (me )?(the )?(work|roles|jobs|experience))\b/i.test(
    query,
  )
}
