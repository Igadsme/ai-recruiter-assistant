import { useEffect, useState } from "react"
import {
  ContactCta,
  FollowUps,
  SourcesDisclosure,
} from "../../components/ChatExtras"
import { DifferentiatorsCard } from "../../components/RecruiterCards"
import { ProjectDeepDiveCard } from "../../components/ProjectDeepDiveCard"
import { MonoLabel, TechTag } from "../../components/ui"
import { ResumeCard } from "./ResumeCard"
import { EvidenceCard, MetricTag } from "./EvidenceCard"
import type { Message } from "./types"
import { useSpeechSynthesis } from "../../hooks/useSpeechSynthesis"

export function VerifiedBadgeNote({ note }: { note: string }) {
  return (
    <p
      style={{
        fontSize: 12.5,
        color: "rgba(248,196,100,0.75)",
        marginBottom: 10,
        lineHeight: 1.5,
      }}
    >
      {note}
    </p>
  )
}

export function AssistantMessage({
  msg,
  isNew,
  onAsk,
  onResume,
  onContact,
  voiceEnabled,
}: {
  msg: Message
  isNew: boolean
  onAsk: (query: string) => void
  onResume: () => void
  onContact: () => void
  voiceEnabled: boolean
}) {
  const r = msg.response
  const fullIntro = r?.intro ?? msg.text
  const sections = r?.sections ?? []
  const evidence = r?.evidence ?? []
  const sources = r?.sources ?? []

  const [displayedIntro, setDisplayedIntro] = useState(isNew ? "" : fullIntro)
  const [visibleSections, setVisibleSections] = useState(
    isNew ? 0 : sections.length,
  )
  const [evidenceVisible, setEvidenceVisible] = useState(!isNew)
  const [streaming, setStreaming] = useState(isNew)
  const { speak, supported } = useSpeechSynthesis()

  useEffect(() => {
    if (!isNew) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setDisplayedIntro(fullIntro)
      setStreaming(false)
      setVisibleSections(sections.length)
      setEvidenceVisible(true)
      return
    }
    let i = 0
    const words = fullIntro.split(/(\s+)/)
    const iv = setInterval(() => {
      i++
      setDisplayedIntro(words.slice(0, i).join(""))
      if (i >= words.length) {
        clearInterval(iv)
        setStreaming(false)
        sections.forEach((_, idx) => {
          setTimeout(
            () => setVisibleSections((v) => Math.max(v, idx + 1)),
            (idx + 1) * 180,
          )
        })
        setTimeout(() => setEvidenceVisible(true), sections.length * 180 + 260)
      }
    }, 28)
    return () => clearInterval(iv)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (isNew && voiceEnabled && supported && fullIntro && !streaming) {
      speak(fullIntro)
    }
  }, [isNew, voiceEnabled, supported, fullIntro, streaming, speak])

  return (
    <div className="animate-fade-up" style={{ width: "100%", maxWidth: 680 }}>
      <p
        className={streaming ? "streaming-cursor" : ""}
        style={{
          fontSize: 15,
          fontWeight: 380,
          color: "rgba(255,255,255,0.84)",
          lineHeight: 1.75,
          letterSpacing: "-0.012em",
          whiteSpace: "pre-wrap",
        }}
      >
        {displayedIntro}
      </p>

      {/* Resume sections only */}
      {r?.isResume && sections.length > 0 && visibleSections > 0 && (
        <div className="flex flex-col gap-3" style={{ marginTop: 20 }}>
          {sections.slice(0, visibleSections).map((s, i) => (
            <div
              key={i}
              className="animate-scale-in rounded-xl"
              style={{
                background: "rgba(255,255,255,0.027)",
                border: "1px solid rgba(255,255,255,0.075)",
                padding: "14px 16px",
              }}
            >
              {/* Section header row */}
              <div
                className="flex items-center gap-3"
                style={{ marginBottom: 10 }}
              >
                <MonoLabel>{s.label}</MonoLabel>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.055)",
                  }}
                />
              </div>

              {s.body && (
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.58)",
                    lineHeight: 1.65,
                    marginBottom: s.tags.length || s.metrics?.length ? 10 : 0,
                  }}
                >
                  {s.body}
                </p>
              )}

              {(s.tags.length > 0 || (s.metrics?.length ?? 0) > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <TechTag key={t} label={t} />
                  ))}
                  {s.metrics?.map((m) => <MetricTag key={m} label={m} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {r && evidenceVisible && (
        <>
          {r.differentiators && (
            <DifferentiatorsCard groups={r.differentiators} />
          )}
          {r.projectDeepDive && (
            <ProjectDeepDiveCard project={r.projectDeepDive} />
          )}
          {!r.conversational && (
            <SourcesDisclosure
              sources={sources}
              stages={r.retrievalStages}
              recruiterSummary={r.recruiterSummary}
              verified={r.verified}
              verificationNote={r.verificationNote}
              defaultOpen={Boolean(r.revealSources)}
            />
          )}
        </>
      )}

      {/* Evidence */}
      {evidence.length > 0 &&
        evidenceVisible &&
        sources.length === 0 &&
        !r?.conversational && (
          <div className="animate-fade-in" style={{ marginTop: 20 }}>
            <div
              className="flex items-center gap-3"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.055)",
                paddingTop: 16,
                marginBottom: 10,
              }}
            >
              <MonoLabel color="rgba(255,255,255,0.24)">EVIDENCE</MonoLabel>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.045)",
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              {evidence.map((e) => (
                <EvidenceCard key={e.id} item={e} />
              ))}
            </div>
          </div>
        )}

      {/* Resume card */}
      {r?.isResume && evidenceVisible && (
        <div className="animate-fade-in">
          <ResumeCard />
        </div>
      )}

      {evidenceVisible && r?.followUps && r.followUps.length > 0 && (
        <FollowUps prompts={r.followUps} onSelect={onAsk} />
      )}
      {evidenceVisible && r?.showContactCta && (
        <ContactCta onResume={onResume} onContact={onContact} />
      )}
    </div>
  )
}

// ─── User message ──────────────────────────────────────────────────────────────

export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-in">
      <div
        style={{
          maxWidth: 400,
          background: "rgba(110,168,255,0.09)",
          border: "1px solid rgba(110,168,255,0.18)",
          borderRadius: 16,
          padding: "10px 16px",
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.55,
            letterSpacing: "-0.01em",
          }}
        >
          {text}
        </p>
      </div>
    </div>
  )
}

export function ErrorMessage({ text }: { text: string }) {
  return (
    <div
      role="alert"
      className="animate-fade-up"
      style={{ width: "100%", maxWidth: 680 }}
    >
      <MonoLabel color="rgba(248,196,100,0.70)">ERROR</MonoLabel>
      <p
        style={{
          fontSize: 15,
          fontWeight: 380,
          color: "rgba(255,255,255,0.72)",
          lineHeight: 1.75,
          letterSpacing: "-0.012em",
          marginTop: 8,
        }}
      >
        {text}
      </p>
    </div>
  )
}

// ─── Chat input ────────────────────────────────────────────────────────────────
