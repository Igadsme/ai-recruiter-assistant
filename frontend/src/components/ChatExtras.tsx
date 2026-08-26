import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { fetchBrief, type RecruiterSummary, type RetrievalStage, type Source } from '../services/api'
import { RecruiterSummaryCard } from './RecruiterCards'
import { SourcesList } from './SourcesList'
import { MonoLabel } from './ui'

export function FollowUps({
  prompts,
  onSelect,
}: {
  prompts: string[]
  onSelect: (query: string) => void
}) {
  if (prompts.length === 0) return null
  return (
    <div style={{ marginTop: 16 }}>
      <MonoLabel color="rgba(255,255,255,0.28)">WANT TO EXPLORE FURTHER?</MonoLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            aria-label={`Ask: ${prompt}`}
            style={{
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.55)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ContactCta({
  onResume,
  onContact,
}: {
  onResume: () => void
  onContact: () => void
}) {
  const [github, setGithub] = useState('https://github.com/Igadsme')
  useEffect(() => {
    void fetchBrief()
      .then((brief) => setGithub(brief.github))
      .catch(() => undefined)
  }, [])
  return (
    <div
      style={{
        marginTop: 16,
        borderRadius: 12,
        border: '1px solid rgba(110,168,255,0.18)',
        padding: 14,
        background: 'rgba(110,168,255,0.05)',
      }}
    >
      <MonoLabel>IMANI APPEARS RELEVANT TO THE AREAS YOU EXPLORED</MonoLabel>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 1.5 }}>
        Would you like to view his résumé or contact him?
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={onResume} style={ctaStyle}>
          View resume
        </button>
        <a href={github} target="_blank" rel="noreferrer" style={{ ...ctaStyle, textDecoration: 'none' }}>
          GitHub
        </a>
        <button type="button" onClick={onContact} style={ctaStyle}>
          Contact
        </button>
      </div>
    </div>
  )
}

const ctaStyle: CSSProperties = {
  fontSize: 12.5,
  color: 'rgba(190,215,255,0.9)',
  background: 'rgba(110,168,255,0.1)',
  border: '1px solid rgba(110,168,255,0.22)',
  borderRadius: 999,
  padding: '6px 12px',
  cursor: 'pointer',
}

export function VerifiedBadge({
  verified,
  note,
}: {
  verified: boolean
  note?: string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <MonoLabel color={verified ? 'rgba(74,222,128,0.7)' : 'rgba(248,196,100,0.75)'}>
        {verified ? 'VERIFIED CANDIDATE INFORMATION' : 'NOT VERIFIED'}
      </MonoLabel>
      {note && (
        <p style={{ fontSize: 12.5, color: 'rgba(248,196,100,0.75)', marginTop: 6, lineHeight: 1.5 }}>{note}</p>
      )}
    </div>
  )
}

export function RetrievalActivity({ stages }: { stages: Array<{ id: string; label: string; status: string }> }) {
  if (stages.length === 0) return null
  return (
    <div style={{ marginTop: 12, marginBottom: 4 }}>
      <MonoLabel color="rgba(255,255,255,0.22)">RETRIEVAL</MonoLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        {stages.map((stage) => (
          <span key={stage.id} style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>
            {stage.status === 'done' ? '✓' : '·'} {stage.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function SourcesDisclosure({
  sources,
  stages,
  recruiterSummary,
  verified,
  verificationNote,
  defaultOpen = false,
}: {
  sources: Source[]
  stages?: RetrievalStage[]
  recruiterSummary?: RecruiterSummary
  verified?: boolean
  verificationNote?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasChrome =
    sources.length > 0 || (stages && stages.length > 0) || Boolean(recruiterSummary) || Boolean(verificationNote)
  if (!hasChrome) return null

  return (
    <div style={{ marginTop: 18 }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Hide evidence' : 'View evidence'}
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.12em',
          color: open ? 'rgba(110,168,255,0.88)' : 'rgba(255,255,255,0.42)',
          background: open ? 'rgba(110,168,255,0.10)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(110,168,255,0.28)' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: 8,
          padding: '6px 12px',
          cursor: 'pointer',
        }}
      >
        {open ? 'HIDE EVIDENCE' : 'VIEW EVIDENCE'}
      </button>
      {open && (
        <div className="animate-fade-in" style={{ marginTop: 12 }}>
          <VerifiedBadge verified={verified !== false} note={verificationNote} />
          {stages && stages.length > 0 && <RetrievalActivity stages={stages} />}
          {recruiterSummary && <RecruiterSummaryCard summary={recruiterSummary} />}
          {sources.length > 0 && <SourcesList sources={sources} />}
        </div>
      )}
    </div>
  )
}
