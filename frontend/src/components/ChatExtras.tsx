import type { CSSProperties } from 'react'
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
      <MonoLabel>INTERESTED IN INTERVIEWING IMANI?</MonoLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={onResume} style={ctaStyle}>
          View resume
        </button>
        <a href="https://github.com/Igadsme" target="_blank" rel="noreferrer" style={{ ...ctaStyle, textDecoration: 'none' }}>
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
