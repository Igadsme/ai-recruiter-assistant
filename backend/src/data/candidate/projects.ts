export type ProjectEntry = {
  id: string
  title: string
  subtitle: string
  start: string
  end: string
  bullets: string[]
  technologies: string[]
  metrics: string[]
  categories: Array<'ai' | 'fullstack' | 'computer-vision'>
}

export const projects: ProjectEntry[] = [
  {
    id: 'devdash',
    title: 'DevDash',
    subtitle: 'AI-Powered Developer Productivity Platform',
    start: 'April 2026',
    end: 'May 2026',
    bullets: [
      'Built a full-stack SaaS application using Next.js and Prisma.',
      'Integrated GitHub APIs to ingest 1,000+ commits, pull requests, and CI/CD events.',
      'Implemented LLM summarization and task prioritization using the OpenAI API.',
      'Reduced manual reporting time by 80%.',
    ],
    technologies: ['Next.js', 'Prisma', 'GitHub API', 'OpenAI API', 'TypeScript'],
    metrics: ['1,000+ commits ingested', '-80% reporting time'],
    categories: ['ai', 'fullstack'],
  },
  {
    id: 'securitycam',
    title: 'AI Security Camera Investigator',
    subtitle: 'Object detection and semantic CCTV search',
    start: 'June 2026',
    end: 'July 2026',
    bullets: [
      'Built an object detection system using FastAPI and YOLOv8 with a Next.js frontend.',
      'Implemented embedding-based search over CCTV metadata for ranked, timestamped query results.',
    ],
    technologies: ['FastAPI', 'YOLOv8', 'Next.js', 'Embeddings', 'Python'],
    metrics: [],
    categories: ['ai', 'computer-vision', 'fullstack'],
  },
]
