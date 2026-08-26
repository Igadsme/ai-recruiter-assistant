import { useEffect, useState, type ReactNode } from 'react'
import { fetchBrief, type RecruiterBrief } from '../services/api'
import { MonoLabel, TechTag } from './ui'

export function RecruiterBriefCard({
  onAsk,
  onFit,
  onInterview,
  onTimeline,
}: {
  onAsk: () => void
  onFit: () => void
  onInterview: () => void
  onTimeline: () => void
}) {
  const [brief, setBrief] = useState<RecruiterBrief | null>(null)

  useEffect(() => {
    void fetchBrief().then(setBrief).catch(() => undefined)
  }, [])

  if (!brief) {
    return (
      <div
        role="status"
        style={{
          width: '100%',
          maxWidth: 640,
          borderRadius: 18,
          border: '1px solid rgba(110,168,255,0.18)',
          background: 'rgba(255,255,255,0.03)',
          padding: '22px',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        Loading recruiter brief from the candidate API…
      </div>
    )
  }

  return (
    <div
      className="animate-fade-up"
      style={{
        width: '100%',
        maxWidth: 640,
        borderRadius: 18,
        border: '1px solid rgba(110,168,255,0.18)',
        background: 'rgba(255,255,255,0.03)',
        padding: '22px 22px 18px',
        textAlign: 'left',
      }}
    >
      <MonoLabel>RECRUITER BRIEF</MonoLabel>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 350,
          letterSpacing: '-0.04em',
          color: 'rgba(255,255,255,0.9)',
          margin: '10px 0 4px',
        }}
      >
        {brief.candidate}
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', marginBottom: 16 }}>{brief.title}</p>

      <BriefRow label="Education" value={brief.education} />
      <BriefRow label="Graduation" value={brief.graduation} />
      <BriefRow label="Focus" value={brief.focus.join(' · ')} />
      <BriefRow
        label="Experience"
        value={`${brief.relevantExperienceCount} roles · ${brief.relevantExperienceLabel}`}
      />
      <BriefRow label="AI projects" value={`${brief.aiProjectCount} independent projects`} />
      <BriefRow label="Best-fit roles" value={brief.bestFitRoles.join(', ')} />
      <BriefRow label="Availability" value={brief.availability} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
        {brief.coreTechnologies.map((tech) => (
          <TechTag key={tech} label={tech} />
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
        <PrimaryButton onClick={onAsk}>Ask about this candidate →</PrimaryButton>
        <GhostButton onClick={onFit}>Fit analysis</GhostButton>
        <GhostButton onClick={onInterview}>Interview me</GhostButton>
        <GhostButton onClick={onTimeline}>Timeline</GhostButton>
      </div>
    </div>
  )
}

function BriefRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.32)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>{value}</span>
    </div>
  )
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 13,
        color: 'rgba(210,228,255,0.95)',
        background: 'rgba(110,168,255,0.16)',
        border: '1px solid rgba(110,168,255,0.32)',
        borderRadius: 999,
        padding: '8px 16px',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function GhostButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.45)',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 999,
        padding: '8px 12px',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
