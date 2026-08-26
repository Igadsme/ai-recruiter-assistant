export type ExperienceEntry = {
  id: string
  organization: string
  role: string
  start: string
  end: string
  bullets: string[]
  technologies: string[]
  metrics: string[]
  why?: string
  memory?: string
  categories: Array<'software' | 'ai' | 'web' | 'cybersecurity' | 'enterprise' | 'teaching'>
}

export const experience: ExperienceEntry[] = [
  {
    id: 'lutheran',
    organization: 'Lutheran Service School',
    role: 'Coding Instructor',
    start: 'August 2021',
    end: 'July 2022',
    bullets: [
      'Mentored 25 students in Python with projects, building creativity, problem-solving, and coding skills.',
      'Guided students with limited English in Python projects, teaching coding basics and independent skills.',
    ],
    technologies: ['Python'],
    metrics: ['25 students mentored'],
    why: 'He knew what it felt like to be new somewhere, and he wanted students to gain real confidence — not just syntax.',
    memory:
      'He still remembers watching a student who had struggled with English successfully finish and explain a Python project they built themselves. Seeing them go from hesitant to proudly presenting their work reminded him that teaching is about giving people confidence, not just technical skills.',
    categories: ['teaching'],
  },
  {
    id: 'upcancer',
    organization: 'UpCancer',
    role: 'Software Engineering Intern',
    start: 'January 2024',
    end: 'May 2024',
    bullets: [
      'Built Python and TypeScript microservices using Redis-cached PostgreSQL, increasing throughput by 15% and reducing latency by 20%.',
      'Designed REST API contracts with front-end engineers, reducing integration friction across distributed services.',
    ],
    technologies: ['Python', 'TypeScript', 'PostgreSQL', 'Redis', 'REST APIs'],
    metrics: ['+15% throughput', '-20% latency'],
    why: 'He wanted his first real software engineering experience and the chance to work on production systems that impacted real users.',
    categories: ['software'],
  },
  {
    id: 'truespice',
    organization: 'TrueSpice Foods',
    role: 'Web Developer Intern',
    start: 'May 2025',
    end: 'August 2025',
    bullets: [
      'Refactored the website using React and CSS media queries to improve cross-device responsiveness.',
      'Optimized performance using semantic HTML and lazy loading, reducing load time by 30%.',
      'Audited and resolved accessibility issues across key pages.',
    ],
    technologies: ['React', 'CSS', 'HTML', 'Accessibility'],
    metrics: ['-30% load time'],
    why: 'He wanted to learn how software supports real business operations and improve his backend engineering skills in a startup environment.',
    categories: ['web'],
  },
  {
    id: 'headstarter',
    organization: 'Headstarter AI',
    role: 'Software Engineering Fellow',
    start: 'July 2025',
    end: 'September 2025',
    bullets: [
      'Built 5 AI projects using Pinecone, Gemini API, embeddings, and RAG for semantic search and retrieval.',
      'Analyzed user and project data to optimize AI features, supporting 500+ users.',
    ],
    technologies: ['Pinecone', 'Gemini API', 'Embeddings', 'RAG', 'Python'],
    metrics: ['5 AI projects', '500+ users'],
    why: 'He joined because he wanted to work alongside ambitious builders, strengthen his AI engineering skills, and ship projects quickly.',
    categories: ['ai', 'software'],
  },
  {
    id: 'wellstar',
    organization: 'Wellstar Health System',
    role: 'IT Platforms Applications Intern',
    start: 'November 2025',
    end: 'July 2026',
    bullets: [
      'Developed ServiceNow workflows using JavaScript, server-side business rules, and Script Includes.',
      'Built REST APIs through ServiceNow Integration Hub.',
      'Automated ITSM workflows, reducing the resolution backlog from 80% to 20% across 200–300 tickets.',
    ],
    technologies: ['ServiceNow', 'JavaScript', 'REST APIs', 'ITSM'],
    metrics: ['80% → 20% backlog', '200–300 tickets'],
    why: 'He wanted exposure to enterprise-scale technology and to see how software improves healthcare operations.',
    categories: ['enterprise', 'software'],
  },
  {
    id: 'shaw',
    organization: 'Shaw Industries',
    role: 'Cybersecurity Co-op',
    start: 'January 2026',
    end: 'June 2026',
    bullets: [
      'Built log ingestion pipelines in Microsoft Sentinel using DCRs, custom tables, and schemas for non-native telemetry.',
      'Architected a syslog pipeline for Palo Alto firewall logs using CEF forwarding and severity-based filtering.',
      'Validated ingestion accuracy using KQL schema checks and cross-source correlation in Log Analytics.',
    ],
    technologies: ['Microsoft Sentinel', 'KQL', 'Palo Alto', 'CEF', 'Log Analytics'],
    metrics: [],
    why: 'He wanted to understand how software and technology solve problems in large industrial organizations while learning from experienced engineers.',
    categories: ['cybersecurity'],
  },
]
