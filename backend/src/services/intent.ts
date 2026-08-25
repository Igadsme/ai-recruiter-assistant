import { education, experience, profile } from '../data/candidate/index.ts'
import type { ConversationIntent } from '../types.ts'

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
  /^(who('?s| is) (imani|gad|he|this( candidate| person| guy)?)( gad)?|tell me about (imani|gad|him)( gad)?|introduce (imani|him|yourself)|what should i know about (imani|him|gad)|give me (an |a )?(intro|introduction)|who is this|about (imani|him)( gad)?)$/i

const PROOF =
  /\b(show me (proof|sources|the (sources|evidence|citations?))|proof|sources|cite that|show (sources|evidence)|where('?s| is) (that )?from|citations?)\b/i

const RESUME = /\b(r[eé]sum[eé]|cv|download|\bpdf\b)\b/i
const WHY_HIRE =
  /\b(why (should (i|we) |would (i|we|you) )?(interview|hire)|what makes (him|imani).*(different|unique)|stand out|why interview|why hire him)\b/i
const CONTACT = /\b(contact|email|phone|linkedin|reach)\b/i
const LEADING_GREETING = /^(hi|hey|hello|howdy|yo|hiya)[,!\s]+/i

export function classifyConversationIntent(raw: string): ConversationIntent {
  const normalized = normalizeUtterance(raw)
  if (!normalized) return 'greeting'
  if (isBareGreeting(normalized)) return 'greeting'

  const stripped = stripLeadingGreeting(normalized)
  const core = stripped || normalized

  if (THANKS.test(core)) return 'thanks'
  if (SMALL_TALK.test(core) || SMALL_TALK.test(normalized)) return 'small_talk'
  if (ASSISTANT_IDENTITY.test(core)) return 'assistant'

  if (RESUME.test(core) || RESUME.test(raw)) return 'resume'
  if (PROOF.test(core) || PROOF.test(normalized)) return 'proof'
  if (WHY_HIRE.test(core) || WHY_HIRE.test(raw)) return 'why_hire'
  if (CONTACT.test(core) || CONTACT.test(raw)) return 'contact'
  if (isIntroduction(core)) return 'introduction'

  return 'candidate'
}

export function needsRetrieval(intent: ConversationIntent): boolean {
  return intent === 'candidate' || intent === 'why_hire' || intent === 'proof' || intent === 'contact'
}

export function needsLlm(intent: ConversationIntent): boolean {
  return intent === 'candidate' || intent === 'why_hire' || intent === 'contact'
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

  return "Hey! I'm Imani's AI assistant. What would you like to know about him?"
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

export function casualFollowUps(intent: ConversationIntent): string[] {
  if (intent === 'introduction') {
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
  return /^(show me (proof|sources|the (work|evidence|sources))|proof|sources|cite that|show (sources|evidence)|where('?s| is) (that )?from)$/.test(
    normalized,
  )
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
