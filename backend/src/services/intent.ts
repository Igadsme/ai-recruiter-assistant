import { education, experience, profile } from '../data/candidate/index.ts'
import type { ConversationIntent, PipelinePath } from '../types.ts'

export type { ConversationIntent }

const GREETING_CORE =
  /^(hi|hii+|hey+|hello+|howdy|yo|hiya|sup|what'?s up|whats up|good (morning|afternoon|evening)|greetings|morning|hey there|hi there|hello there|hey imani|hi imani|hello imani)( there)?( folks| everyone)?$/i

const SMALL_TALK =
  /^(how are you( doing)?|how'?s it going|how are things|how do you do|how have you been|you good|you okay|are you (ok|okay|good)|what'?s going on|how'?s your day)$/i

const THANKS =
  /^(thanks|thank you|thx|ty|appreciate it|that'?s helpful|got it|cool thanks|thanks so much)( so much)?$/i

const ASSISTANT_IDENTITY =
  /^(who are you|what are you|are you (imani|a (bot|robot|human|person|ai))|what can you (do|help with)|what do you do)$/i

const NAMED_TOPIC =
  /\b(shaw|upcancer|wellstar|headstarter|truespice|lutheran|devdash|camera investigator|intern|internship|co-?op|project|resume|cyber|backend|frontend|ai experience|skills?|education|hackathon)\b/i

const INTRODUCTION =
  /^(who('?s| is) (imani|gad|he|this( candidate| person| guy)?)( gad)?|tell me about (imani|gad|him)( gad)?|introduce (imani|him|yourself)|what should i know about (imani|him|gad)|give me (an |a )?(intro|introduction|overview)|who is this|about (imani|him)( gad)?|60.?second overview)$/i

const PROOF =
  /\b(show me (proof|sources|the (sources|evidence|citations?))|proof|sources|cite that|show (sources|evidence)|where('?s| is) (that )?from|citations?|view evidence)\b/i

const RESUME = /\b(r[eé]sum[eé]|cv|download|\bpdf\b)\b/i
const WHY_HIRE =
  /\b(why (should (i|we) |would (i|we|you) )?(interview|hire)|what makes (him|imani).*(different|unique)|stand out|why interview|why hire him)\b/i
const CONTACT = /\b(contact|email|phone|linkedin|reach)\b/i
const LEADING_GREETING = /^(hi|hey|hello|howdy|yo|hiya)[,!\s]+/i

const EXPERIENCE =
  /\b(experience|intern|internship|co-?op|work history|career|roles?|jobs?|shaw|upcancer|wellstar|headstarter|truespice|lutheran|software engineering experience)\b/i
const PROJECTS =
  /\b(project|built|build|created|developed|devdash|camera investigator|saas|portfolio|what has he (built|shipped)|architecture)\b/i
const SKILLS =
  /\b(skills?|stack|languages?|frameworks?|tools?|technolog|proficien|python|typescript|react|next\.js)\b/i
const STORY =
  /\b(story|background|born|rwanda|congo|congolese|immigrant|personal|grew up|childhood|family|journey|swahili|kinyarwanda|hobby|hobbies)\b/i
const FIT =
  /\b(fit|job description|this role|evaluate (him|imani)|match (him |imani )?(for|against)|paste(d)? (a |the )?jd|qualifications? coverage)\b/i
const INTERVIEW =
  /\b(interview (him|imani|question|simulat)|mock interview|practice interview|ask him a question)\b/i
const VAGUE =
  /^(tell me more|more|and\??|what about (him|that)|go on|continue|anything else|idk|i don'?t know|maybe|whatever|stuff|things)$/i
const SENSITIVE =
  /\b(ssn|social security|password|salary (expectation|history|number)|how much does he make|credit card|home address|immigration status|visa status|citizenship|race|religion|sexual orientation|disability|medical)\b/i
const UNSUPPORTED =
  /\b(google|meta|netflix|amazon|apple|microsoft intern|senior (architect|staff|principal)|phd|cleared|secret clearance|10\+ years)\b/i

export function classifyConversationIntent(raw: string): ConversationIntent {
  const normalized = normalizeUtterance(raw)
  if (!normalized) return 'greeting'
  if (isBareGreeting(normalized)) return 'greeting'

  const stripped = stripLeadingGreeting(normalized)
  const core = stripped || normalized

  if (THANKS.test(core)) return 'thanks'
  if (SMALL_TALK.test(core) || SMALL_TALK.test(normalized)) return 'small_talk'
  if (ASSISTANT_IDENTITY.test(core)) return 'assistant'
  if (SENSITIVE.test(core) || SENSITIVE.test(raw)) return 'sensitive'
  if (isUnsupportedClaim(core, raw)) return 'unsupported'
  if (VAGUE.test(core)) return 'vague'

  if (RESUME.test(core) || RESUME.test(raw)) return 'resume'
  if (PROOF.test(core) || PROOF.test(normalized)) return 'proof'
  if (WHY_HIRE.test(core) || WHY_HIRE.test(raw)) return 'why_hire'
  if (CONTACT.test(core) || CONTACT.test(raw)) return 'contact'
  if (looksLikeJobDescription(raw) || FIT.test(core) || FIT.test(raw)) return 'fit_analysis'
  if (INTERVIEW.test(core) || INTERVIEW.test(raw)) return 'interview'
  if (isIntroduction(core)) return 'introduction'
  if (STORY.test(core) && !NAMED_TOPIC.test(core)) return 'story'
  if (PROJECTS.test(core) || PROJECTS.test(raw)) return 'projects'
  if (EXPERIENCE.test(core) || EXPERIENCE.test(raw)) return 'experience'
  if (SKILLS.test(core) || SKILLS.test(raw)) return 'skills'

  return 'candidate'
}

export function pipelinePath(intent: ConversationIntent): PipelinePath {
  if (isConversationalIntent(intent) || intent === 'vague' || intent === 'unsupported' || intent === 'sensitive') {
    return 'casual'
  }
  if (intent === 'fit_analysis' || intent === 'interview') return 'recruiter_tool'
  return 'candidate'
}

export function needsRetrieval(intent: ConversationIntent): boolean {
  return (
    intent === 'candidate' ||
    intent === 'experience' ||
    intent === 'projects' ||
    intent === 'skills' ||
    intent === 'story' ||
    intent === 'why_hire' ||
    intent === 'proof' ||
    intent === 'contact' ||
    intent === 'fit_analysis'
  )
}

export function needsLlm(intent: ConversationIntent): boolean {
  return (
    intent === 'candidate' ||
    intent === 'experience' ||
    intent === 'projects' ||
    intent === 'skills' ||
    intent === 'story' ||
    intent === 'why_hire' ||
    intent === 'contact'
  )
}

export function isConversationalIntent(intent: ConversationIntent): boolean {
  return intent === 'greeting' || intent === 'small_talk' || intent === 'thanks' || intent === 'assistant'
}

export function conversationalReply(intent: ConversationIntent, historyLength: number): string {
  if (intent === 'thanks') {
    return historyLength > 0
      ? "You're welcome. If you want more on Imani's work, just ask."
      : "You're welcome — I'm Imani's AI assistant, so feel free to ask about his experience whenever you're ready."
  }

  if (intent === 'small_talk') {
    return "Doing well, thanks for asking. I'm Imani's AI assistant — what would you like to know about him?"
  }

  if (intent === 'assistant') {
    return "I'm Imani's AI assistant. I can walk you through his experience, projects, and background — just not as Imani himself. What would you like to know?"
  }

  if (historyLength > 0) {
    return "Hey again — still happy to help. What would you like to know about Imani?"
  }

  return "Hey! I'm Imani's AI assistant. I can tell you about his experience, projects, skills, or what roles he may fit. What would you like to know?"
}

export function introductionReply(): string {
  const professional = experience.filter((role) => role.organization !== 'Lutheran Service School')
  const recent = professional.slice(-2).map((role) => role.organization)
  return [
    `Imani is a Computer Science student at ${education.school}, graduating ${education.expectedGraduation}.`,
    `He's interned across software, AI, cybersecurity, and enterprise automation — including ${recent.join(' and ')}.`,
    `Ask about a role, a project, or why a team might hire him and I'll go deeper.`,
  ].join(' ')
}

export function proofReply(hasPriorQuestion: boolean): string {
  if (hasPriorQuestion) {
    return "Here's the verified evidence behind that. Expand any source for the underlying role or project."
  }
  return `Here's the verified evidence I have on ${profile.name}'s work. Open a source to see the details.`
}

export function vagueReply(): string {
  return "I can go a few directions — his internships, projects like DevDash, skills, or how he'd fit a specific role. What would help most?"
}

export function unsupportedReply(): string {
  return "I don't have verified information about that."
}

export function sensitiveReply(): string {
  return "I don't share private details like that. I can talk about Imani's verified experience, projects, and skills instead."
}

export function injectionReply(): string {
  return "I can only help with questions about Imani Gad's verified background. What would you like to know about his work?"
}

export function casualFollowUps(intent: ConversationIntent): string[] {
  if (intent === 'introduction' || intent === 'vague') {
    return [
      'Tell me about Shaw',
      'Why should we hire him?',
      'Show me his résumé',
      'What AI experience does he have?',
    ]
  }
  return [
    'Who is Imani?',
    'Tell me about Shaw',
    'Why should we hire him?',
    'Show me his résumé',
  ]
}

export function isBareProofQuery(query: string): boolean {
  const normalized = normalizeUtterance(query)
  return /^(show me (proof|sources|the (work|evidence|sources))|proof|sources|cite that|show (sources|evidence)|where('?s| is) (that )?from|view evidence)$/.test(
    normalized,
  )
}

export function looksLikeJobDescription(text: string): boolean {
  if (text.length < 120) return false
  return /\b(responsibilities|requirements|qualifications|preferred qualifications|about the role|we are looking for|job description)\b/i.test(
    text,
  )
}

function isUnsupportedClaim(core: string, raw: string): boolean {
  if (!UNSUPPORTED.test(core) && !UNSUPPORTED.test(raw)) return false
  if (NAMED_TOPIC.test(core) || NAMED_TOPIC.test(raw)) return false
  return true
}

function isIntroduction(text: string): boolean {
  if (NAMED_TOPIC.test(text)) return false
  return INTRODUCTION.test(text)
}

function isBareGreeting(text: string): boolean {
  return GREETING_CORE.test(text)
}

function stripLeadingGreeting(text: string): string {
  if (!LEADING_GREETING.test(text)) return ''
  const stripped = text.replace(LEADING_GREETING, '').trim()
  return stripped === text ? '' : stripped
}

function normalizeUtterance(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[éè]/g, 'e')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, ' ')
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
