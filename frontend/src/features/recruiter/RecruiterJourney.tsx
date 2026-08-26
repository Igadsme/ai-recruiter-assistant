import { MonoLabel } from '../../components/ui'

export function RecruiterJourney({
  onMeet,
  onEvaluate,
  onExplore,
}: {
  onMeet: () => void
  onEvaluate: () => void
  onExplore: () => void
}) {
  return (
    <div
      role="navigation"
      aria-label="Recruiter paths"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 10,
        width: '100%',
      }}
    >
      <JourneyCard
        label="Meet Imani"
        detail="Background, internships, and how he works."
        onClick={onMeet}
      />
      <JourneyCard
        label="Evaluate him for a role"
        detail="Paste a job description for an evidence-backed fit score."
        onClick={onEvaluate}
      />
      <JourneyCard
        label="Explore his work"
        detail="Projects, timeline, and what he actually shipped."
        onClick={onExplore}
      />
    </div>
  )
}

function JourneyCard({
  label,
  detail,
  onClick,
}: {
  label: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '14px 14px 16px',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.09)',
        background: 'rgba(255,255,255,0.03)',
        cursor: 'pointer',
        minHeight: 108,
      }}
    >
      <MonoLabel color="rgba(110,168,255,0.8)">{label.toUpperCase()}</MonoLabel>
      <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.52)', lineHeight: 1.45 }}>{detail}</p>
    </button>
  )
}
