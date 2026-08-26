import { experience, projects } from '../data/candidate/index.ts'
import type { ConversationMessage } from '../types.ts'

const FOLLOW_UP =
  /^(what (did|does) (he|imani) (build|do|ship|work on) (there|then|at that)|there\??|and (there|that)\??|what about (that|there)|tell me more( about (that|it|there))?|which (one|project)|that one)$/i

const ORG_ALIASES: Array<{ pattern: RegExp; expand: string }> = [
  ...experience.map((role) => ({
    pattern: new RegExp(role.organization.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    expand: `${role.role} at ${role.organization}`,
  })),
  ...projects.map((project) => ({
    pattern: new RegExp(project.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    expand: project.title,
  })),
]

export function isFollowUpQuery(message: string): boolean {
  const normalized = message.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (FOLLOW_UP.test(normalized)) return true
  return /\b(there|that|it|those|them)\b/i.test(normalized) && normalized.split(' ').length <= 10
}

export function resolveFollowUpQuery(message: string, history: ConversationMessage[]): string {
  if (!isFollowUpQuery(message) || history.length === 0) return message
  const recent = [...history].reverse().map((item) => item.content).join(' \n ')
  const hit = ORG_ALIASES.find((alias) => alias.pattern.test(recent))
  if (!hit) return `${message} ${lastUserTurn(history)}`.trim()
  return `${message} ${hit.expand}`.trim()
}

function lastUserTurn(history: ConversationMessage[]): string {
  return [...history].reverse().find((item) => item.role === 'user')?.content ?? ''
}
