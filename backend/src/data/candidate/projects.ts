export type ArchitectureNode = {
  id: string
  label: string
  detail: string
  row: number
  column: number
}

export type ArchitectureEdge = {
  from: string
  to: string
}

export type ProjectArchitecture = {
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
}

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
  problem: string
  solution: string
  architectureSummary: string
  architecture: ProjectArchitecture
  contributed: string[]
  challenges: string[]
  impact: string[]
  github?: string
  website?: string
}

export const projects: ProjectEntry[] = [
  {
    id: 'devdash',
    title: 'DevDash',
    subtitle: 'AI-Powered Developer Productivity Platform',
    start: 'April 2026',
    end: 'May 2026',
    bullets: [
      'Built a full-stack developer productivity SaaS with Next.js and Prisma, integrating GitHub APIs to process 1,000+ commits, PRs, and CI/CD events.',
      'Developed LLM summarization and task prioritization via the OpenAI API, reducing manual reporting time by 80%.',
    ],
    technologies: ['Next.js', 'Prisma', 'GitHub API', 'OpenAI API', 'TypeScript'],
    metrics: ['1,000+ commits ingested', '-80% reporting time'],
    categories: ['ai', 'fullstack'],
    problem:
      'Developer productivity data is fragmented across GitHub commits, pull requests, and CI/CD events, so status reporting has to be assembled by hand.',
    solution:
      'A full-stack SaaS app that ingests GitHub activity, then uses an LLM to summarize work and prioritize tasks instead of compiling reports manually.',
    architectureSummary: 'Next.js → Prisma → GitHub API and OpenAI API',
    architecture: {
      nodes: [
        { id: 'frontend', label: 'Frontend', detail: 'Next.js / TypeScript', row: 0, column: 1 },
        { id: 'data', label: 'Data layer', detail: 'Prisma', row: 1, column: 0 },
        { id: 'github', label: 'GitHub API', detail: 'Commits, PRs, CI/CD', row: 1, column: 1 },
        { id: 'llm', label: 'OpenAI API', detail: 'Summaries & prioritization', row: 1, column: 2 },
      ],
      edges: [
        { from: 'frontend', to: 'data' },
        { from: 'frontend', to: 'github' },
        { from: 'frontend', to: 'llm' },
      ],
    },
    contributed: [
      'Designed and built the full-stack SaaS application in Next.js and Prisma.',
      'Wired GitHub APIs to ingest more than 1,000 commits, pull requests, and CI/CD events.',
      'Implemented LLM summarization and task prioritization with the OpenAI API.',
    ],
    challenges: [
      'Pulling commits, pull requests, and CI/CD events into one workflow instead of leaving them scattered across GitHub.',
      'Turning raw repository activity into summaries and prioritized tasks without adding another manual reporting step.',
    ],
    impact: ['Ingested 1,000+ GitHub events', 'Reduced manual reporting time by 80%'],
    github: 'https://github.com/Igadsme',
    website: 'https://devdash.com',
  },
  {
    id: 'securitycam',
    title: 'AI Security Camera Investigator',
    subtitle: 'Object detection and semantic CCTV search',
    start: 'June 2026',
    end: 'July 2026',
    bullets: [
      'Engineered a computer-vision pipeline with YOLOv8 and FastAPI to detect and track subjects across CCTV footage.',
      'Built embedding-based semantic search over CCTV metadata, returning ranked results with timestamped detections.',
    ],
    technologies: ['FastAPI', 'YOLOv8', 'Next.js', 'Embeddings', 'Python'],
    metrics: [],
    categories: ['ai', 'computer-vision', 'fullstack'],
    problem:
      'Reviewing CCTV footage usually means scrubbing timestamps. Finding a person, object, or event by what happened requires detection plus search over video metadata.',
    solution:
      'An investigator app with YOLOv8 object detection behind FastAPI, a Next.js frontend, and embedding search that returns ranked, timestamped results from CCTV metadata.',
    architectureSummary: 'Next.js → FastAPI → YOLOv8 and embedding search',
    architecture: {
      nodes: [
        { id: 'frontend', label: 'Frontend', detail: 'Next.js', row: 0, column: 1 },
        { id: 'api', label: 'Backend', detail: 'FastAPI / Python', row: 1, column: 1 },
        { id: 'yolo', label: 'Detection', detail: 'YOLOv8', row: 2, column: 0 },
        { id: 'search', label: 'Semantic search', detail: 'Embeddings over metadata', row: 2, column: 2 },
      ],
      edges: [
        { from: 'frontend', to: 'api' },
        { from: 'api', to: 'yolo' },
        { from: 'api', to: 'search' },
      ],
    },
    contributed: [
      'Engineered the computer-vision pipeline with FastAPI and YOLOv8, including the Next.js frontend.',
      'Built embedding-based semantic search over CCTV metadata for ranked, timestamped detections.',
    ],
    challenges: [
      'Running object detection and exposing it through an API that a frontend can query.',
      'Making footage searchable by meaning — ranked, timestamped hits — instead of only by time range.',
    ],
    impact: ['Object detection across CCTV footage', 'Ranked, timestamped semantic search over metadata'],
    github: 'https://github.com/Igadsme',
  },
]
