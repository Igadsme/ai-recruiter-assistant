export const differentiators = {
  technical: [
    {
      label: 'Full-stack development',
      evidence: 'Next.js and Prisma on DevDash; React at TrueSpice Foods; TypeScript services at UpCancer.',
      sourceIds: ['project:devdash', 'experience:truespice', 'experience:upcancer'],
    },
    {
      label: 'AI / LLM integration',
      evidence: 'OpenAI summarization on DevDash; RAG, Pinecone, and Gemini at Headstarter AI; YOLOv8 and embeddings on the camera project.',
      sourceIds: ['project:devdash', 'experience:headstarter', 'project:securitycam'],
    },
    {
      label: 'Backend / API development',
      evidence: 'Python and TypeScript microservices with Redis-cached PostgreSQL at UpCancer; REST APIs at Wellstar; FastAPI on the camera project.',
      sourceIds: ['experience:upcancer', 'experience:wellstar', 'project:securitycam'],
    },
    {
      label: 'Cloud / deployment experience',
      evidence: 'AWS and Docker are on his verified skills list. Production services used Redis and PostgreSQL at UpCancer.',
      sourceIds: ['skill:tools', 'experience:upcancer'],
    },
  ],
  builder: [
    {
      label: 'Independently developed projects',
      evidence: 'DevDash and the AI Security Camera Investigator are personal projects, not jobs.',
      sourceIds: ['project:devdash', 'project:securitycam'],
    },
    {
      label: 'AI-powered applications',
      evidence: 'Five AI projects during the Headstarter fellowship, plus DevDash and the camera investigator.',
      sourceIds: ['experience:headstarter', 'project:devdash', 'project:securitycam'],
    },
    {
      label: 'Developer tooling',
      evidence: 'DevDash ingests GitHub commits, PRs, and CI/CD events and cuts manual reporting time by 80%.',
      sourceIds: ['project:devdash'],
    },
  ],
  communication: [
    {
      label: 'Coding instruction / mentoring',
      evidence: 'Mentored 25 students in Python at Lutheran Service School, including learners with limited English.',
      sourceIds: ['experience:lutheran'],
    },
    {
      label: 'Explaining technical concepts',
      evidence: 'Guided students with limited English through Python projects until they could present the work themselves.',
      sourceIds: ['experience:lutheran', 'story:teaching'],
    },
  ],
} as const
