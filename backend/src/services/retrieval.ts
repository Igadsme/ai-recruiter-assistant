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
import { cosineSimilarity, embedText } from './embeddings.ts'
import type { CandidateCategory, ConversationIntent, RetrievalStage, Source, SourceType } from '../types.ts'

export type RetrievalResult = {
  categories: CandidateCategory[]
  intents: CandidateCategory[]
  context: string
  sources: Source[]
  stages: RetrievalStage[]
  verified: boolean
  verificationNote?: string
  expandedTerms: string[]
  projectId?: string
  insufficient: boolean
  topScore: number
}

type Chunk = {
  id: string
  type: SourceType
  category: string
  title: string
  organization?: string
  date?: string
  technologies: string[]
  metrics: string[]
  excerpt: string
  text: string
  aliases: string[]
  categories: CandidateCategory[]
}

const TECH_INVENTORY = buildTechInventory()

const QUERY_EXPANSION: Record<string, string[]> = {
  backend: ['api', 'apis', 'server', 'servers', 'microservice', 'microservices', 'postgresql', 'postgres', 'redis', 'node', 'nodejs', 'fastapi', 'rest', 'database', 'databases', 'sql'],
  frontend: ['react', 'next.js', 'nextjs', 'css', 'html', 'ui', 'accessibility', 'responsive'],
  ai: ['artificial', 'intelligence', 'machine', 'learning', 'ml', 'llm', 'rag', 'embedding', 'embeddings', 'pinecone', 'gemini', 'openai', 'yolo', 'yolov8', 'computer', 'vision', 'vector'],
  cybersecurity: ['cyber', 'security', 'sentinel', 'kql', 'palo', 'alto', 'siem', 'syslog', 'cef', 'firewall'],
  databases: ['postgresql', 'postgres', 'mysql', 'mongodb', 'cassandra', 'redis', 'prisma', 'sql'],
  cloud: ['aws', 'docker', 'deploy', 'deployment'],
  intern: ['internship', 'internships', 'co-op', 'coop', 'fellow', 'fellowship', 'role', 'job'],
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'his', 'he', 'him',
  'does', 'do', 'did', 'has', 'have', 'what', 'which', 'who', 'about', 'tell', 'me', 'imani',
  'gad', 'please', 'can', 'you', 'your',
])

function buildTechInventory(): Set<string> {
  const values = [
    ...skills.languages,
    ...skills.frameworks,
    ...skills.tools,
    ...experience.flatMap((role) => role.technologies),
    ...projects.flatMap((project) => project.technologies),
    'REST APIs',
    'RAG',
    'Embeddings',
  ]
  return new Set(values.map(normalizeTech))
}

function normalizeTech(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#]/g, '')
}

const CHUNKS: Chunk[] = buildChunks()
const DOC_TOKENS = CHUNKS.map((chunk) => tokenize(`${chunk.text} ${chunk.aliases.join(' ')}`))
const IDF = buildIdf(DOC_TOKENS)
const CHUNK_VECTORS = DOC_TOKENS.map((tokens) => sparseTfidf(tokens))
const CHUNK_EMBEDDINGS = CHUNKS.map((chunk) => embedText(`${chunk.text} ${chunk.aliases.join(' ')}`))
const KNOWN_ORGS = new Set(
  CHUNKS.flatMap((chunk) => [chunk.organization, chunk.title].filter(Boolean).map((value) => value!.toLowerCase())),
)

function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [
    {
      id: 'profile:imani',
      type: 'story',
      category: 'Profile',
      title: 'Candidate profile',
      excerpt: `${profile.name} · ${profile.title} · ${profile.availability}`,
      text: `PROFILE ${profile.name} ${profile.title} ${profile.availability} ${profile.email} ${profile.phone} ${profile.linkedin} ${profile.github}`,
      technologies: [],
      metrics: [],
      aliases: ['contact', 'email', 'phone', 'linkedin', 'availability', 'hire'],
      categories: ['profile', 'contact'],
    },
    {
      id: 'education:ksu',
      type: 'education',
      category: 'Education',
      title: education.degree,
      organization: education.school,
      date: `Expected ${education.expectedGraduation}`,
      excerpt: `Relevant coursework: ${education.coursework.join(', ')}.`,
      text: `EDUCATION ${education.degree} ${education.school} graduation ${education.expectedGraduation} coursework ${education.coursework.join(' ')} computer science kennesaw ksu`,
      technologies: [...education.coursework],
      metrics: [],
      aliases: ['school', 'university', 'degree', 'graduate', 'graduation'],
      categories: ['education', 'profile'],
    },
    {
      id: 'skill:languages',
      type: 'skill',
      category: 'Skills',
      title: 'Languages',
      excerpt: skills.languages.join(', '),
      text: `LANGUAGES ${skills.languages.join(' ')}`,
      technologies: [...skills.languages],
      metrics: [],
      aliases: ['language', 'coding', 'programming'],
      categories: ['skills'],
    },
    {
      id: 'skill:frameworks',
      type: 'skill',
      category: 'Skills',
      title: 'Frameworks',
      excerpt: skills.frameworks.join(', '),
      text: `FRAMEWORKS ${skills.frameworks.join(' ')} react node next pytorch tensorflow flask`,
      technologies: [...skills.frameworks],
      metrics: [],
      aliases: ['framework', 'library', 'stack'],
      categories: ['skills', 'frontend', 'backend', 'ai'],
    },
    {
      id: 'skill:tools',
      type: 'skill',
      category: 'Skills',
      title: 'Tools and platforms',
      excerpt: skills.tools.join(', '),
      text: `TOOLS ${skills.tools.join(' ')} postgresql aws docker mysql`,
      technologies: [...skills.tools],
      metrics: [],
      aliases: ['cloud', 'database', 'aws', 'docker'],
      categories: ['skills', 'backend'],
    },
    {
      id: 'activity:orgs',
      type: 'activity',
      category: 'Activities',
      title: 'Student organizations',
      excerpt: `Member of ${activities.organizations.join(', ')}.`,
      text: `ACTIVITIES ${activities.organizations.join(' ')} ieee shpe colorstack ai club leadership community`,
      technologies: [],
      metrics: [],
      aliases: ['club', 'organization', 'leadership'],
      categories: ['activities'],
    },
    {
      id: 'activity:hackathons',
      type: 'activity',
      category: 'Activities',
      title: 'Hackathons',
      excerpt: `${activities.hackathons.participations} participations, ${activities.hackathons.wins} wins. ${activities.hackathons.note}`,
      text: `HACKATHONS ${activities.hackathons.participations} participations ${activities.hackathons.wins} wins ${activities.hackathons.note}`,
      technologies: [],
      metrics: [
        `${activities.hackathons.wins} hackathon wins`,
        `${activities.hackathons.participations} hackathon participations`,
      ],
      aliases: ['hackathon', 'deadline', 'ship'],
      categories: ['activities', 'why_hire'],
    },
    {
      id: 'story:background',
      type: 'story',
      category: 'Story',
      title: 'Personal background',
      date: `Moved to the United States in ${story.movedToUnitedStates}`,
      excerpt: story.summary,
      text: `STORY ${story.inHisWords} ${story.summary} rwanda congo congolese swahili kinyarwanda immigrant 2018`,
      technologies: [],
      metrics: [],
      aliases: ['born', 'rwanda', 'background', 'life', 'story', 'who'],
      categories: ['story', 'profile'],
    },
    {
      id: 'story:teaching',
      type: 'story',
      category: 'Story',
      title: 'Teaching memory',
      excerpt: story.teachingMemory,
      text: `TEACHING ${story.teachingMemory} lutheran mentor instructor`,
      technologies: ['Python'],
      metrics: [],
      aliases: ['teach', 'mentor', 'student'],
      categories: ['story', 'why_hire', 'activities'],
    },
  ]

  for (const role of experience) {
    chunks.push({
      id: `experience:${role.id}`,
      type: 'experience',
      category: 'Experience',
      title: role.role,
      organization: role.organization,
      date: formatDateRange(role.start, role.end),
      excerpt: role.bullets.join(' '),
      text: [
        role.role,
        role.organization,
        role.bullets.join(' '),
        role.technologies.join(' '),
        role.why ?? '',
        role.memory ?? '',
        role.categories.join(' '),
      ].join(' '),
      technologies: [...role.technologies],
      metrics: [...role.metrics],
      aliases: [role.organization, role.id, ...role.categories],
      categories: [
        'experience',
        ...(role.categories.includes('ai') ? (['ai'] as const) : []),
        ...(role.categories.includes('cybersecurity') ? (['cybersecurity'] as const) : []),
        ...(role.categories.includes('web') ? (['frontend'] as const) : []),
        ...(role.categories.includes('software') || role.categories.includes('enterprise')
          ? (['backend'] as const)
          : []),
      ],
    })
  }

  for (const project of projects) {
    chunks.push({
      id: `project:${project.id}`,
      type: 'project',
      category: 'Projects',
      title: project.title,
      organization: project.subtitle,
      date: formatDateRange(project.start, project.end),
      excerpt: project.bullets.join(' '),
      text: [
        project.title,
        project.subtitle,
        project.bullets.join(' '),
        project.problem,
        project.solution,
        project.technologies.join(' '),
        project.contributed.join(' '),
        project.categories.join(' '),
      ].join(' '),
      technologies: [...project.technologies],
      metrics: [...project.metrics],
      aliases: [project.id, 'project', 'built', 'saas', 'portfolio'],
      categories: ['projects', ...(project.categories.includes('ai') ? (['ai'] as const) : [])],
    })
  }

  return chunks
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^\.+|\.+$/g, ''))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
}

function buildIdf(docs: string[][]): Map<string, number> {
  const df = new Map<string, number>()
  for (const tokens of docs) {
    for (const term of new Set(tokens)) {
      df.set(term, (df.get(term) ?? 0) + 1)
    }
  }
  const idf = new Map<string, number>()
  for (const [term, count] of df) {
    idf.set(term, Math.log((docs.length + 1) / (count + 1)) + 1)
  }
  return idf
}

function sparseTfidf(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const token of tokens) freq.set(token, (freq.get(token) ?? 0) + 1)
  const vector = new Map<string, number>()
  const len = Math.max(tokens.length, 1)
  for (const [term, count] of freq) {
    vector.set(term, (count / len) * (IDF.get(term) ?? 1))
  }
  return vector
}

function sparseCosine(a: Map<string, number>, b: Map<string, number>): number {
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a]
  let dot = 0
  let magA = 0
  let magB = 0
  for (const value of a.values()) magA += value * value
  for (const value of b.values()) magB += value * value
  for (const [term, value] of smaller) {
    const other = larger.get(term)
    if (other) dot += value * other
  }
  if (!magA || !magB) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function expandQuery(query: string): string[] {
  const base = tokenize(query)
  const expanded = new Set(base)
  for (const token of base) {
    const extras = QUERY_EXPANSION[token]
    if (extras) {
      for (const extra of extras) expanded.add(extra)
    }
    for (const [key, values] of Object.entries(QUERY_EXPANSION)) {
      if (values.includes(token)) expanded.add(key)
    }
  }
  return [...expanded]
}

export function analyzeQuery(query: string): CandidateCategory[] {
  const intents = new Set<CandidateCategory>()

  if (RESUME_KEYWORDS.test(query)) intents.add('resume')
  if (CONTACT_KEYWORDS.test(query)) intents.add('contact')
  if (AI_KEYWORDS.test(query)) intents.add('ai')
  if (CYBER_KEYWORDS.test(query)) intents.add('cybersecurity')
  if (BACKEND_KEYWORDS.test(query)) intents.add('backend')
  if (FRONTEND_KEYWORDS.test(query)) intents.add('frontend')
  if (WHY_HIRE_KEYWORDS.test(query)) intents.add('why_hire')
  if (PROJECT_KEYWORDS.test(query) || PROJECT_NAME.test(query)) intents.add('projects')
  if (EXPERIENCE_KEYWORDS.test(query)) intents.add('experience')
  if (SKILL_KEYWORDS.test(query)) intents.add('skills')
  if (EDUCATION_KEYWORDS.test(query)) intents.add('education')
  if (ACTIVITY_KEYWORDS.test(query)) intents.add('activities')
  if (STORY_KEYWORDS.test(query) || OVERVIEW_KEYWORDS.test(query)) {
    intents.add('story')
    intents.add('profile')
  }

  if (intents.has('ai') && !CYBER_KEYWORDS.test(query)) intents.delete('cybersecurity')

  if (intents.size === 0) {
    intents.add('profile')
    intents.add('experience')
    intents.add('skills')
  }

  return [...intents]
}

export function retrieveCandidateContext(
  query: string,
  options: { intent?: ConversationIntent } = {},
): RetrievalResult {
  const intents = analyzeQuery(query)
  const expandedTerms = expandQuery(query)
  const queryVector = sparseTfidf(expandedTerms)
  const queryEmbedding = embedText(query)
  const typeFilter = typeFilterForIntent(options.intent)
  const ranked = CHUNKS.map((chunk, index) => {
    const keywordScore = keywordRank(expandedTerms, chunk)
    const semanticScore = sparseCosine(queryVector, CHUNK_VECTORS[index])
    const embeddingScore = cosineSimilarity(queryEmbedding, CHUNK_EMBEDDINGS[index])
    const intentBoost = intentScore(intents, chunk)
    const penalty = intentPenalty(intents, chunk)
    const typeBoost = typeFilter && chunk.type === typeFilter ? 0.12 : 0
    return {
      chunk,
      score:
        0.4 * keywordScore + 0.25 * semanticScore + 0.2 * embeddingScore + 0.15 * intentBoost + typeBoost - penalty,
    }
  })
    .sort((a, b) => b.score - a.score)

  const minScore = 0.08
  let selected = rerank(ranked.filter((item) => item.score >= minScore).slice(0, 14), query).slice(0, 10)

  if (intents.includes('ai') && !intents.includes('cybersecurity')) {
    selected = selected.filter(
      (item) => !item.chunk.categories.includes('cybersecurity') || item.chunk.categories.includes('ai'),
    )
  }

  if (selected.length === 0) {
    selected = ranked.slice(0, 4)
  }

  const alwaysInclude = CHUNKS.filter((chunk) => {
    if (intents.includes('contact') && chunk.id === 'profile:imani') return true
    if ((intents.includes('education') || intents.includes('resume')) && chunk.id === 'education:ksu') return true
    if (intents.includes('why_hire') && chunk.id.startsWith('story:')) return true
    return false
  })
  for (const chunk of alwaysInclude) {
    if (!selected.some((item) => item.chunk.id === chunk.id)) {
      selected.push({ chunk, score: 1 })
    }
  }

  if (intents.includes('ai')) {
    for (const chunk of CHUNKS) {
      if (chunk.categories.includes('ai') && !selected.some((item) => item.chunk.id === chunk.id)) {
        selected.push({ chunk, score: 0.9 })
      }
    }
  }

  const sources = selected.map(({ chunk }) => toSource(chunk))
  const topScore = selected[0]?.score ?? 0
  const unknownEmployer = unknownEmployers(query)
  const askedUnknown = [...unknownTechnologies(query), ...unknownEmployer]
  const insufficient = Boolean(unknownEmployer.length) || (topScore < 0.09 && isSpecificUnknown(query))
  const verified = askedUnknown.length === 0 && !insufficient
  const verificationNote = verified
    ? undefined
    : `Not verified: the candidate file does not confirm experience with ${askedUnknown.join(', ') || 'that topic'}.`

  return {
    categories: intents,
    intents,
    context: insufficient ? '' : buildContext(selected.map((item) => item.chunk), intents),
    sources: insufficient ? [] : dedupeSources(sources),
    stages: buildStages(intents, selected.map((item) => item.chunk)),
    verified,
    verificationNote,
    expandedTerms,
    projectId: inferProjectId(query),
    insufficient,
    topScore,
  }
}

function typeFilterForIntent(intent?: ConversationIntent): SourceType | undefined {
  if (intent === 'experience') return 'experience'
  if (intent === 'projects') return 'project'
  if (intent === 'skills') return 'skill'
  if (intent === 'story') return 'story'
  return undefined
}

function rerank(ranked: Array<{ chunk: Chunk; score: number }>, query: string): Array<{ chunk: Chunk; score: number }> {
  const lower = query.toLowerCase()
  return ranked
    .map((item) => {
      let score = item.score
      if (item.chunk.organization && lower.includes(item.chunk.organization.toLowerCase())) score += 0.25
      if (lower.includes(item.chunk.title.toLowerCase())) score += 0.2
      for (const tech of item.chunk.technologies) {
        if (lower.includes(tech.toLowerCase())) score += 0.05
      }
      return { ...item, score }
    })
    .sort((a, b) => b.score - a.score)
}

function unknownEmployers(query: string): string[] {
  const mentioned = [...query.matchAll(/\b[A-Z][A-Za-z0-9&.]{2,24}\b/g)].map((match) => match[0])
  const skip = new Set(['Imani', 'Gad', 'What', 'Does', 'Have', 'Tell', 'About', 'How', 'The', 'His'])
  return mentioned.filter((name) => {
    if (skip.has(name)) return false
    const lower = name.toLowerCase()
    if (KNOWN_ORGS.has(lower)) return false
    return /^(Google|Meta|Netflix|Amazon|Apple|Uber|Stripe|Nvidia|OpenAI)$/i.test(name)
  })
}

function isSpecificUnknown(query: string): boolean {
  return /\b(did he|has he|was he|intern(ed)? at|worked at|certification|clearance)\b/i.test(query)
}

function inferProjectId(query: string): string | undefined {
  if (/devdash/i.test(query)) return 'devdash'
  if (/camera|investigator|cctv|yolo/i.test(query)) return 'securitycam'
  return undefined
}

function keywordRank(terms: string[], chunk: Chunk): number {
  const haystack = tokenize(`${chunk.text} ${chunk.aliases.join(' ')} ${chunk.technologies.join(' ')}`)
  const hayset = new Set(haystack)
  let hits = 0
  for (const term of terms) {
    if (hayset.has(term)) hits += 1
    else if (haystack.some((token) => token.includes(term) || term.includes(token))) hits += 0.5
  }
  return hits / Math.max(terms.length, 1)
}

function intentScore(intents: CandidateCategory[], chunk: Chunk): number {
  if (chunk.categories.some((category) => intents.includes(category))) return 1
  return 0
}

function intentPenalty(intents: CandidateCategory[], chunk: Chunk): number {
  if (intents.includes('ai') && !intents.includes('cybersecurity') && chunk.categories.includes('cybersecurity')) {
    return 0.6
  }
  return 0
}

function unknownTechnologies(query: string): string[] {
  const mentioned = [...query.matchAll(/\b[A-Za-z][A-Za-z0-9+#.]{1,24}\b/g)].map((match) => match[0])
  const interesting = mentioned.filter((token) => {
    const normalized = normalizeTech(token)
    if (normalized.length < 3) return false
    return KNOWN_JD_TECH.has(normalized) && !TECH_INVENTORY.has(normalized)
  })
  return [...new Set(interesting)]
}

const KNOWN_JD_TECH = new Set(
  [
    'kubernetes',
    'k8s',
    'terraform',
    'ansible',
    'graphql',
    'kafka',
    'spark',
    'hadoop',
    'scala',
    'golang',
    'go',
    'rust',
    'swift',
    'ruby',
    'php',
    'django',
    'spring',
    'vue',
    'svelte',
    'azure',
    'gcp',
    'snowflake',
    'databricks',
    'helm',
    'istio',
  ].map(normalizeTech),
)

function toSource(chunk: Chunk): Source {
  return {
    id: chunk.id,
    type: chunk.type,
    category: chunk.category,
    title: chunk.title,
    organization: chunk.organization,
    date: chunk.date,
    technologies: chunk.technologies.length > 0 ? chunk.technologies : undefined,
    metrics: chunk.metrics.length > 0 ? chunk.metrics : undefined,
    relevantExcerpt: chunk.excerpt,
    verified: true,
  }
}

function dedupeSources(sources: Source[]): Source[] {
  const seen = new Set<string>()
  const result: Source[] = []
  for (const source of sources) {
    if (seen.has(source.id)) continue
    seen.add(source.id)
    result.push(source)
  }
  return result
}

function buildContext(chunks: Chunk[], intents: CandidateCategory[]): string {
  const lines = [
    'Verified candidate evidence for this question. Use ONLY these facts.',
    'Projects are personal/independent work — not employment.',
    intents.includes('contact')
      ? `CONTACT\nEmail: ${profile.email}\nPhone: ${profile.phone}\nLinkedIn: ${profile.linkedin}\nGitHub: https://${profile.github}`
      : '',
  ]
  for (const chunk of chunks) {
    lines.push(
      [
        `${chunk.category.toUpperCase()} · ${chunk.title}${chunk.organization ? ` — ${chunk.organization}` : ''}`,
        chunk.date ? `Dates: ${chunk.date}` : '',
        chunk.excerpt,
        chunk.technologies.length ? `Technologies: ${chunk.technologies.join(', ')}` : '',
        chunk.metrics.length ? `Metrics: ${chunk.metrics.join(', ')}` : '',
        `Source id: ${chunk.id}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }
  return lines.filter(Boolean).join('\n\n')
}

function buildStages(intents: CandidateCategory[], chunks: Chunk[]): RetrievalStage[] {
  const wanted = [
    { id: 'experience', label: 'Experience', match: (chunk: Chunk) => chunk.type === 'experience' },
    { id: 'projects', label: 'Projects', match: (chunk: Chunk) => chunk.type === 'project' },
    { id: 'skills', label: 'Skills', match: (chunk: Chunk) => chunk.type === 'skill' },
    { id: 'education', label: 'Education', match: (chunk: Chunk) => chunk.type === 'education' },
  ]
  return wanted.map((stage) => ({
    id: stage.id,
    label: stage.label,
    status: chunks.some(stage.match) || intents.includes(stage.id as CandidateCategory) ? 'done' : 'skipped',
  }))
}

const AI_KEYWORDS =
  /\b(ai|artificial intelligence|machine learning|\bml\b|llm|gpt|rag|embedding|pinecone|gemini|openai|yolo|computer vision|vector|semantic search)\b/i
const CYBER_KEYWORDS =
  /\b(cyber|security|sentinel|kql|palo alto|siem|syslog|cef|firewall|log analytics)\b/i
const PROJECT_KEYWORDS =
  /\b(project|built|build|created|developed|devdash|camera|saas|portfolio|architecture)\b/i
const PROJECT_NAME = /\b(devdash|security camera|camera investigator|cctv)\b/i
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
const RESUME_KEYWORDS = /\b(r[eé]sum[eé]|cv|download|pdf|document)\b/i
const OVERVIEW_KEYWORDS =
  /\b(tell me about|overview|introduce|introduction|who is|60.second|summary)\b/i
const CONTACT_KEYWORDS = /\b(contact|email|phone|linkedin|reach)\b/i
const BACKEND_KEYWORDS =
  /\b(backend|back-end|api|apis|server|postgres|postgresql|redis|node\.?js|fastapi|microservice|database)\b/i
const FRONTEND_KEYWORDS =
  /\b(frontend|front-end|react|css|html|ui|accessibility|responsive)\b/i
const WHY_HIRE_KEYWORDS =
  /\b(why (should (i|we) |would (i|we|you) )?(interview|hire)|what makes (him|imani).*(different|unique)|stand out|why interview|why hire him)\b/i

export function isResumeQuery(query: string): boolean {
  return RESUME_KEYWORDS.test(query)
}

export function isEvidenceQuery(query: string): boolean {
  return /\b(evidence|sources?|proof|cite|citations?|show (me )?(the )?(work|roles|jobs|experience))\b/i.test(
    query,
  )
}

export function isWhyHireQuery(query: string): boolean {
  return WHY_HIRE_KEYWORDS.test(query)
}

export function isContactQuery(query: string): boolean {
  return CONTACT_KEYWORDS.test(query)
}

export function getSourceById(id: string): Source | undefined {
  const chunk = CHUNKS.find((item) => item.id === id)
  return chunk ? toSource(chunk) : undefined
}

export function allSources(): Source[] {
  return CHUNKS.map(toSource)
}

export { TECH_INVENTORY, normalizeTech }
