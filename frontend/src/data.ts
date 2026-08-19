export const CANDIDATE = {
  name: 'Imani Gad',
  title: 'Software Engineer',
  school: 'Kennesaw State University',
  degree: 'B.S. Computer Science',
  graduation: 'December 2026',
  email: 'gad.imani@yahoo.com',
  phone: '404-932-1821',
  linkedin: 'https://www.linkedin.com/in/igad/',
  github: 'github.com/Igadsme',
}

export type MessageSection = {
  label: string
  body: string
  tags: string[]
  metrics?: string[]
}

export type EvidenceItem = {
  id: string
  company: string
  role: string
  period: string
  description: string
  tags: string[]
  metrics?: string[]
}

export type CannedResponse = {
  intro: string
  sections: MessageSection[]
  evidence: EvidenceItem[]
  isResume?: boolean
  sources?: import('./services/api').Source[]
  verified?: boolean
  verificationNote?: string
  followUps?: string[]
  retrievalStages?: import('./services/api').RetrievalStage[]
  recruiterSummary?: import('./services/api').RecruiterSummary
  projectDeepDive?: import('./services/api').ProjectDeepDive
  differentiators?: import('./services/api').DifferentiatorGroup[]
  showContactCta?: boolean
  session?: import('./services/api').RecruiterSession
}

const EVIDENCE = {
  lutheran: {
    id: 'lutheran',
    company: 'Lutheran Service School',
    role: 'Coding Instructor',
    period: 'August 2021 – July 2022',
    description:
      'Mentored 10 immigrant students in Python, building creativity, problem-solving, and coding skills. Guided students with limited English through Python projects, teaching coding basics and independent skills.',
    tags: ['Python', 'Teaching', 'Mentorship'],
    metrics: ['10 students mentored'],
  },
  upcancer: {
    id: 'upcancer',
    company: 'UpCancer',
    role: 'Software Engineering Intern',
    period: 'January 2024 – May 2024',
    description:
      'Built Python and TypeScript microservices using Redis-cached PostgreSQL, boosting throughput 15% and reducing latency 20%. Partnered with front-end engineers to define and document RESTful API contracts, accelerating cross-team integration.',
    tags: ['Python', 'TypeScript', 'PostgreSQL', 'Redis', 'REST APIs'],
    metrics: ['+15% throughput', '-20% latency'],
  },
  truespice: {
    id: 'truespice',
    company: 'TrueSpice Foods',
    role: 'Web Developer Intern',
    period: 'May 2025 – August 2025',
    description:
      'Refactored the website using React and CSS media queries, improving cross-device responsiveness. Optimized performance via semantic HTML and lazy loading, reducing load time by 30%. Audited and resolved accessibility issues across key pages.',
    tags: ['React', 'CSS', 'Accessibility', 'Performance', 'HTML'],
    metrics: ['-30% load time'],
  },
  headstarter: {
    id: 'headstarter',
    company: 'Headstarter AI',
    role: 'Software Engineering Fellow',
    period: 'July 2025 – September 2025',
    description:
      'Built 5 AI projects using Pinecone, Gemini API, embeddings, and RAG for semantic search and retrieval. Analyzed project data to optimize AI features, reaching 500+ users.',
    tags: ['RAG', 'Pinecone', 'Gemini API', 'Embeddings', 'Python'],
    metrics: ['5 AI projects shipped', '500+ users reached'],
  },
  shaw: {
    id: 'shaw',
    company: 'Shaw Industries',
    role: 'Cybersecurity Co-op',
    period: 'January 2026 – June 2026',
    description:
      'Built log ingestion pipelines in Microsoft Sentinel via DCRs, custom tables, and schemas for non-native telemetry. Architected a syslog pipeline for Palo Alto firewall logs via CEF forwarding with severity-based filtering. Validated ingestion accuracy via KQL schema checks and cross-source correlation in Log Analytics.',
    tags: ['Microsoft Sentinel', 'KQL', 'Palo Alto', 'CEF', 'SIEM', 'Cybersecurity'],
    metrics: ['Enterprise-scale pipeline'],
  },
  wellstar: {
    id: 'wellstar',
    company: 'Wellstar Health System',
    role: 'IT Platforms Applications Intern',
    period: 'November 2025 – July 2026',
    description:
      'Developed ServiceNow workflows using JS, server-side business rules, and Script Includes for enterprise automation. Built REST APIs via ServiceNow Integration Hub to enable interoperability across enterprise platforms. Automated ITSM workflows, cutting resolution backlog from 80% to 20% across 200–300 tickets.',
    tags: ['ServiceNow', 'JavaScript', 'REST APIs', 'ITSM', 'Enterprise Automation'],
    metrics: ['80% → 20% backlog', '200-300 tickets automated'],
  },
  devdash: {
    id: 'devdash',
    company: 'DevDash — AI-Powered Developer Productivity Platform',
    role: 'Personal Project — Lead Engineer',
    period: 'April 2026 – May 2026',
    description:
      'Built full-stack SaaS with Next.js & Prisma; integrated GitHub APIs to ingest 1,000+ commits, PRs, and CI/CD events. Developed LLM summarization and task prioritization via OpenAI API, reducing manual reporting time by 80%.',
    tags: ['Next.js', 'Prisma', 'GitHub API', 'OpenAI', 'TypeScript', 'Full-stack'],
    metrics: ['1,000+ commits ingested', '-80% reporting time'],
  },
  securitycam: {
    id: 'securitycam',
    company: 'AI Security Camera Investigator',
    role: 'Personal Project — Lead Engineer',
    period: 'June 2026 – July 2026',
    description:
      'Built an object detection system using FastAPI and YOLOv8 with a Next.js front end to track subjects across CCTV footage. Implemented an embedding-based search engine over CCTV metadata for ranked, timestamped query results.',
    tags: ['YOLOv8', 'FastAPI', 'Next.js', 'Computer Vision', 'Embeddings', 'Python'],
    metrics: ['Real-time detection', 'Semantic CCTV search'],
  },
}

export const RESPONSES: Record<string, CannedResponse> = {
  about: {
    intro:
      "Imani Gad is a Computer Science student at Kennesaw State University graduating in December 2026. His experience spans software engineering, AI/ML, cybersecurity, web development, and enterprise automation across six roles. He has shipped production software, built AI applications, and delivered measurable outcomes at every stop.",
    sections: [
      {
        label: 'SOFTWARE ENGINEERING',
        body: "Imani Gad has production experience across six roles — from backend microservices and enterprise automation to AI pipelines and cybersecurity infrastructure.",
        tags: ['Python', 'TypeScript', 'React', 'Next.js', 'REST APIs', 'PostgreSQL'],
      },
      {
        label: 'AI & MACHINE LEARNING',
        body: 'He has built RAG pipelines, integrated vector databases, and shipped AI-powered applications reaching 500+ users through the Headstarter AI fellowship.',
        tags: ['RAG', 'Embeddings', 'Pinecone', 'Gemini API', 'OpenAI', 'YOLOv8'],
      },
      {
        label: 'MEASURABLE IMPACT',
        body: 'Imani Gad has delivered quantified improvements across throughput, latency, ticket resolution, and user reach at every role.',
        tags: [],
        metrics: ['+15% throughput', '-20% latency', '-30% load time', '80%→20% backlog', '500+ users'],
      },
    ],
    evidence: [EVIDENCE.upcancer, EVIDENCE.wellstar, EVIDENCE.headstarter],
  },

  experience: {
    intro:
      "Imani Gad has completed six professional roles across software engineering, AI, cybersecurity, and enterprise automation — each with measurable, production-level outcomes.",
    sections: [
      {
        label: 'ENTERPRISE & BACKEND',
        body: 'At Wellstar, he built ServiceNow automation workflows that cut ITSM resolution backlog from 80% to 20% across hundreds of tickets. At UpCancer, his microservices improved throughput by 15% and reduced latency by 20%.',
        tags: ['ServiceNow', 'Python', 'TypeScript', 'PostgreSQL', 'Redis'],
        metrics: ['+15% throughput', '-20% latency', '80%→20% backlog'],
      },
      {
        label: 'CYBERSECURITY',
        body: 'At Shaw Industries, Imani Gad built log ingestion pipelines in Microsoft Sentinel and architected a syslog pipeline for Palo Alto firewall logs with severity-based filtering and KQL validation.',
        tags: ['Microsoft Sentinel', 'KQL', 'Palo Alto', 'CEF', 'SIEM'],
      },
      {
        label: 'AI & WEB',
        body: 'Through Headstarter AI, he shipped 5 AI projects using RAG, Pinecone, and Gemini reaching 500+ users. At TrueSpice Foods, he improved frontend performance and accessibility.',
        tags: ['RAG', 'Pinecone', 'Gemini API', 'React', 'Next.js'],
        metrics: ['5 AI apps shipped', '500+ users', '-30% load time'],
      },
    ],
    evidence: [EVIDENCE.wellstar, EVIDENCE.shaw, EVIDENCE.upcancer, EVIDENCE.headstarter],
  },

  ai: {
    intro:
      "Imani Gad has hands-on experience building AI-powered applications — not just calling APIs, but understanding retrieval systems, embedding pipelines, vector search, and object detection at an architectural level.",
    sections: [
      {
        label: 'RETRIEVAL-AUGMENTED GENERATION',
        body: 'Through Headstarter AI, Imani Gad built RAG pipelines using Pinecone and the Gemini API — implementing semantic search and retrieval for real products that reached 500+ users.',
        tags: ['RAG', 'Pinecone', 'Gemini API', 'Embeddings', 'Semantic Search'],
        metrics: ['500+ users reached'],
      },
      {
        label: 'LLM INTEGRATION',
        body: 'On DevDash, he integrated OpenAI to power LLM summarization and task prioritization across 1,000+ GitHub commits and CI/CD events, reducing manual reporting time by 80%.',
        tags: ['OpenAI', 'LLM', 'Summarization', 'Task Prioritization'],
        metrics: ['-80% reporting time', '1,000+ events processed'],
      },
      {
        label: 'COMPUTER VISION',
        body: 'He built the AI Security Camera Investigator using YOLOv8 and FastAPI for real-time object detection across CCTV footage, backed by an embedding-based search engine over metadata.',
        tags: ['YOLOv8', 'FastAPI', 'Computer Vision', 'Object Detection', 'Embeddings'],
        metrics: ['Real-time detection', 'Timestamped semantic search'],
      },
    ],
    evidence: [EVIDENCE.headstarter, EVIDENCE.devdash, EVIDENCE.securitycam],
  },

  projects: {
    intro:
      "Imani Gad builds beyond his internship work. Both of his major projects are full-stack, AI-powered, and independently shipped — reflecting the ability to take an idea from zero to deployed.",
    sections: [
      {
        label: 'DEVDASH — AI DEVELOPER PRODUCTIVITY',
        body: 'Full-stack SaaS built with Next.js and Prisma. Ingests 1,000+ commits, PRs, and CI/CD events from GitHub APIs. LLM summarization via OpenAI cuts manual reporting time by 80%.',
        tags: ['Next.js', 'Prisma', 'GitHub API', 'OpenAI', 'TypeScript'],
        metrics: ['1,000+ commits ingested', '-80% reporting time', 'Full-stack SaaS'],
      },
      {
        label: 'AI SECURITY CAMERA INVESTIGATOR',
        body: 'Object detection system using FastAPI and YOLOv8 with a Next.js front end. Tracks subjects across CCTV footage and enables ranked, timestamped semantic search over footage metadata.',
        tags: ['YOLOv8', 'FastAPI', 'Next.js', 'Embeddings', 'Computer Vision'],
        metrics: ['Real-time analysis', 'Semantic CCTV search'],
      },
    ],
    evidence: [EVIDENCE.devdash, EVIDENCE.securitycam],
  },

  different: {
    intro:
      "The combination of production engineering experience, genuine AI depth, cybersecurity knowledge, and a track record of building independently is rare at this stage. Most candidates have one — Imani Gad has all of them.",
    sections: [
      {
        label: 'TECHNICAL BREADTH',
        body: "Imani Gad is comfortable across the full stack and beyond: backend services, AI pipelines, cybersecurity infrastructure, enterprise automation, and frontend development. He can contribute immediately in most modern engineering environments.",
        tags: ['Python', 'TypeScript', 'React', 'Next.js', 'ServiceNow', 'Microsoft Sentinel', 'RAG', 'PostgreSQL'],
      },
      {
        label: 'PROVEN PRODUCTION IMPACT',
        body: 'Six roles with quantified outcomes — not just participation. He improved throughput, cut ticket backlogs, reduced load times, shipped AI products to real users, and built security pipelines at enterprise scale.',
        tags: ['UpCancer', 'Wellstar', 'Shaw Industries', 'Headstarter AI', 'TrueSpice'],
        metrics: ['+15% throughput', '80%→20% backlog', '500+ users', '-30% load time'],
      },
      {
        label: 'AI FLUENCY',
        body: "AI is not just a tool Imani Gad uses — it's an area where he has genuine architectural depth. RAG, embeddings, LLM integration, and computer vision are things he has designed, implemented, and shipped.",
        tags: ['RAG', 'YOLOv8', 'Pinecone', 'OpenAI', 'Gemini API', 'Computer Vision'],
      },
      {
        label: 'LEADERSHIP & COMMUNITY',
        body: "6x Hackathon Winner. Active in IEEE Computer Society, SHPE, KSU AI Club, and KSU ColorStack. Imani Gad's involvement extends well beyond the classroom.",
        tags: ['6x Hackathon Winner', 'IEEE', 'SHPE', 'KSU AI Club', 'ColorStack'],
        metrics: ['6x hackathon wins', '12x participant'],
      },
    ],
    evidence: [EVIDENCE.upcancer, EVIDENCE.wellstar, EVIDENCE.headstarter],
  },

  whyHire: {
    intro:
      "Imani Gad has six roles of production experience, genuine AI and cybersecurity depth, and a history of building independently. He delivers measurable outcomes and is still early in his career — the upside is significant.",
    sections: [
      {
        label: 'PRODUCTION TRACK RECORD',
        body: 'Six roles, all with quantified outcomes. Improved throughput, cut backlogs, shipped AI products, built security infrastructure. Not an observer — a contributor.',
        tags: [],
        metrics: ['+15% throughput', '-20% latency', '80%→20% backlog', '500+ users', '-30% load time'],
      },
      {
        label: 'RARE TECHNICAL COMBINATION',
        body: 'Software engineering + AI/ML + cybersecurity is an unusually broad and valuable skill set. Imani Gad has hands-on production experience in all three.',
        tags: ['Python', 'TypeScript', 'RAG', 'YOLOv8', 'Microsoft Sentinel', 'KQL', 'ServiceNow'],
      },
      {
        label: 'PROVEN BUILDER',
        body: 'DevDash and the AI Security Camera Investigator were built and shipped independently — scoped, architected, implemented, and deployed without a team. That is a signal of ownership.',
        tags: ['DevDash', 'AI Security Camera', 'Next.js', 'YOLOv8', 'OpenAI'],
      },
      {
        label: 'GRADUATING DECEMBER 2026',
        body: 'Imani Gad is available for full-time roles at the end of 2026. Interviewing now means you evaluate him before the market does.',
        tags: ['Kennesaw State University', 'CS', 'Dec 2026'],
      },
    ],
    evidence: [EVIDENCE.wellstar, EVIDENCE.headstarter, EVIDENCE.devdash],
  },

  leadership: {
    intro:
      "Leadership at this stage of Imani Gad's career shows up in ownership, teaching, and community — taking responsibility for outcomes and pulling others forward.",
    sections: [
      {
        label: 'TEACHING & MENTORSHIP',
        body: "Before his engineering career, Imani Gad taught coding to 10 immigrant students at Lutheran Service School — guiding learners with limited English through Python fundamentals and independent projects.",
        tags: ['Coding Instruction', 'Python', 'Mentorship', 'Lutheran Service School'],
        metrics: ['10 students mentored'],
      },
      {
        label: 'COMMUNITY & COMPETITION',
        body: 'Imani Gad is a 6x Hackathon Winner and active member of IEEE Computer Society, SHPE, KSU AI Club, and KSU ColorStack. He competes, contributes, and shows up.',
        tags: ['IEEE', 'SHPE', 'KSU AI Club', 'ColorStack'],
        metrics: ['6x hackathon wins', '12x participant'],
      },
      {
        label: 'PROJECT OWNERSHIP',
        body: 'DevDash and the AI Security Camera Investigator were fully self-directed. No manager, no team, no requirements doc — just identifying a problem and shipping a solution end to end.',
        tags: ['DevDash', 'AI Security Camera', 'Self-directed'],
      },
    ],
    evidence: [EVIDENCE.lutheran, EVIDENCE.devdash],
  },

  resume: {
    intro:
      "Imani Gad's resume is available to download and preview below. It covers his full work history, technical skill set, projects, and activities — all on one page.",
    sections: [
      {
        label: 'EDUCATION',
        body: 'Kennesaw State University — B.S. Computer Science. Relevant coursework includes Data Structures, Operating Systems, Machine Learning, Algorithm Analysis, and Deep Learning.',
        tags: ['KSU', 'Computer Science', 'ML', 'Deep Learning', 'Dec 2026'],
      },
      {
        label: 'EXPERIENCE HIGHLIGHTS',
        body: 'Six professional roles spanning software engineering, AI, cybersecurity, and enterprise automation at UpCancer, TrueSpice Foods, Headstarter AI, Shaw Industries, and Wellstar Health System.',
        tags: ['UpCancer', 'Headstarter AI', 'Shaw Industries', 'Wellstar', 'TrueSpice'],
        metrics: ['+15% throughput', '80%→20% backlog', '500+ users'],
      },
      {
        label: 'TECHNICAL SKILLS',
        body: 'Languages, frameworks, tools, and platforms across the full engineering stack.',
        tags: ['Python', 'TypeScript', 'React', 'Next.js', 'PostgreSQL', 'AWS', 'Docker', 'PyTorch', 'TensorFlow'],
      },
    ],
    evidence: [],
    isResume: true,
  },
}

export function matchResponse(query: string): CannedResponse {
  const q = query.toLowerCase()
  if (/(resume|cv|download|pdf|document|view resume)/.test(q))
    return RESPONSES.resume
  if (/(about imani|who is imani|overview|60.second|background|introduce|introduction|tell me about)/.test(q))
    return RESPONSES.about
  if (/(ai experience|machine learning|ml|llm|gpt|rag|embedding|artificial intelligence|ai\b|computer vision|yolo)/.test(q))
    return RESPONSES.ai
  if (/(built|projects?|devdash|security cam|best project|created|developed)/.test(q))
    return RESPONSES.projects
  if (/(different|unique|stand out|special|set apart|strengths?|technical strength)/.test(q))
    return RESPONSES.different
  if (/(interview|hire|why should|reason to|why imani|convince me|why interview)/.test(q))
    return RESPONSES.whyHire
  if (/(software engineering|engineering experience|experience|internship|work history|cybersecurity|wellstar|shaw|truespice)/.test(q))
    return RESPONSES.experience
  if (/(lead|leadership|team|mentor|manage|owner|hackathon|community)/.test(q))
    return RESPONSES.leadership
  return RESPONSES.about
}

export const DEFAULT_CHIPS = [
  "Tell me about Imani Gad",
  "What's Imani Gad's software engineering experience?",
  "What AI experience does Imani Gad have?",
  "What has Imani Gad built?",
  "What makes Imani Gad different?",
  "Why should I interview Imani Gad?",
  "View Imani Gad's resume",
]

export const RECRUITER_CHIPS = [
  "Imani Gad's 60-second overview",
  "Imani Gad's software engineering experience",
  "Imani Gad's AI experience",
  "Imani Gad's best project",
  "Imani Gad's technical strengths",
  "Imani Gad's leadership",
  "Why interview Imani Gad?",
  "View Imani Gad's resume",
]

export const THINKING_LABELS = [
  'SEARCHING CANDIDATE PROFILE',
  'MATCHING EXPERIENCE',
  'MATCHING PROJECTS',
  'VERIFYING SKILLS',
  'GENERATING GROUNDED RESPONSE',
]

export const CONTEXT_DATA = {
  experience: [
    'Lutheran Service School',
    'UpCancer',
    'TrueSpice Foods',
    'Headstarter AI',
    'Shaw Industries',
    'Wellstar Health System',
  ],
  projects: ['DevDash', 'AI Security Camera Investigator'],
  skills: ['Python', 'TypeScript', 'React', 'Next.js', 'AWS', 'PostgreSQL', 'RAG', 'Pinecone', 'OpenAI', 'YOLOv8', 'Microsoft Sentinel'],
}
