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
  sources?: import("./services/api").Source[]
  verified?: boolean
  verificationNote?: string
  followUps?: string[]
  retrievalStages?: import("./services/api").RetrievalStage[]
  recruiterSummary?: import("./services/api").RecruiterSummary
  projectDeepDive?: import("./services/api").ProjectDeepDive
  differentiators?: import("./services/api").DifferentiatorGroup[]
  showContactCta?: boolean
  session?: import("./services/api").RecruiterSession
  conversational?: boolean
  revealSources?: boolean
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
  "SEARCHING CANDIDATE PROFILE",
  "MATCHING EXPERIENCE",
  "MATCHING PROJECTS",
  "VERIFYING SKILLS",
  "GENERATING GROUNDED RESPONSE",
]

const CASUAL_MESSAGE =
  /^(hi|hii+|hey+|hello+|howdy|yo|hiya|sup|what'?s up|whats up|good (morning|afternoon|evening)|greetings|hey there|hi there|hello there|how are you( doing)?|how'?s it going|how are things|thanks|thank you|thx|who are you)$/i

export function isCasualMessage(query: string): boolean {
  const text = query
    .toLowerCase()
    .replace(/[éè]/g, "e")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return CASUAL_MESSAGE.test(text)
}

export function skipsThinkingState(query: string): boolean {
  if (isCasualMessage(query)) return true
  const text = query
    .toLowerCase()
    .replace(/[éè]/g, "e")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return /^(who is (imani|gad|he)( gad)?|tell me about (imani|him)( gad)?|thanks|thank you)$/.test(
    text,
  )
}
