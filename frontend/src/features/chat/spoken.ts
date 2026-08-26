import type { CannedResponse, EvidenceItem } from "../../data"
import type { ChatApiResponse } from "../../services/api"

export function toCannedResponse(
  result: ChatApiResponse,
  _query: string,
): CannedResponse {
  const evidence: EvidenceItem[] = (result.sources ?? [])
    .filter(
      (source) => source.type === "experience" || source.type === "project",
    )
    .map((source, index) => ({
      id: source.id ?? `${source.type}-${index}-${source.title}`,
      company: source.organization ?? source.title,
      role: source.type === "project" ? "Project" : source.title,
      period: source.date ?? "",
      description: source.relevantExcerpt ?? "",
      tags: source.technologies ?? [],
      metrics: source.metrics,
    }))

  const conversational = Boolean(result.conversational)

  return {
    intro: spokenText(result.message, { rewritePerson: !conversational }),
    sections: result.isResume ? (result.sections ?? []) : [],
    evidence,
    isResume: result.isResume,
    sources: result.sources,
    verified: result.verified,
    verificationNote: result.verificationNote,
    followUps: result.followUps,
    retrievalStages: result.retrievalStages,
    recruiterSummary: result.recruiterSummary,
    projectDeepDive: result.projectDeepDive,
    differentiators: result.differentiators,
    showContactCta: result.showContactCta,
    session: result.session,
    conversational,
    revealSources: Boolean(result.revealSources),
  }
}

export function spokenText(
  raw: string,
  options?: { rewritePerson?: boolean },
): string {
  const rewritePerson = options?.rewritePerson !== false
  const trimmed = raw.trim()
  if (!trimmed.startsWith("{"))
    return rewritePerson ? toThirdPersonReply(trimmed) : trimmed
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    for (const key of ["intro", "Intro", "message", "Message"]) {
      const value = parsed[key]
      if (
        typeof value === "string" &&
        value.trim() &&
        !value.trim().startsWith("{")
      ) {
        const spoken = value.trim()
        return rewritePerson ? toThirdPersonReply(spoken) : spoken
      }
    }
    if (Array.isArray(parsed.sections)) {
      return parsed.sections
        .map((section) =>
          section && typeof section === "object" && "body" in section
            ? String((section as { body?: unknown }).body ?? "")
            : "",
        )
        .filter(Boolean)
        .join("\n\n")
    }
  } catch {
    return rewritePerson ? toThirdPersonReply(trimmed) : trimmed
  }
  return rewritePerson ? toThirdPersonReply(trimmed) : trimmed
}

export function toThirdPersonReply(text: string): string {
  let out = text.trim()
  if (
    /\bI['’]m Imani['’]s AI assistant\b/i.test(out) ||
    /\bI am Imani['’]s AI assistant\b/i.test(out)
  ) {
    return out
  }
  if (/^I['’]m\b/i.test(out)) out = out.replace(/^I['’]m\b/i, "Imani is")
  else if (/^I am\b/i.test(out)) out = out.replace(/^I am\b/i, "Imani is")
  else if (/^I['’]ve\b/i.test(out))
    out = out.replace(/^I['’]ve\b/i, "Imani has")
  else if (/^My name is\b/i.test(out))
    out = out.replace(/^My name is\b/i, "Imani is")
  else if (/^My\b/i.test(out)) out = out.replace(/^My\b/i, "Imani's")
  else if (/^I\b/i.test(out)) out = out.replace(/^I\b/i, "Imani")

  out = out.replace(/([.!?]\s+)I\b/g, "$1He")
  return out
    .replace(/\bI['’]m\b/g, "he's")
    .replace(/\bI am\b/g, "he is")
    .replace(/\bI['’]ve\b/g, "he has")
    .replace(/\bI['’]d\b/g, "he'd")
    .replace(/\bI['’]ll\b/g, "he'll")
    .replace(/\bI\b/g, "he")
    .replace(/\bme\b/g, "him")
    .replace(/\bmyself\b/g, "himself")
    .replace(/\b[Mm]y\b/g, "his")
    .replace(/\bmine\b/g, "his")
}
