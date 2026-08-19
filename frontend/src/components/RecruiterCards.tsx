import type { DifferentiatorGroup, RecruiterSummary } from '../services/api'
import { MonoLabel } from './ui'

export function RecruiterSummaryCard({ summary }: { summary: RecruiterSummary }) {
  const rows = [
    ['Relevant experience', summary.relevantExperience],
    ['AI experience', summary.aiExperience],
    ['Backend experience', summary.backendExperience],
    ['Frontend experience', summary.frontendExperience],
    ['Education', summary.education],
    ['Graduation', summary.graduation],
  ]
  return (
    <div
      style={{
        marginTop: 16,
        borderRadius: 12,
        border: '1px solid rgba(110,168,255,0.16)',
        padding: 14,
        background: 'rgba(110,168,255,0.04)',
      }}
    >
      <MonoLabel>RECRUITER SUMMARY</MonoLabel>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)' }}>{value}</span>
          </div>
        ))}
      </div>
      <MonoLabel color="rgba(255,255,255,0.28)">SUGGESTED INTERVIEW TOPICS</MonoLabel>
      <ul style={{ margin: '8px 0 0', paddingLeft: 16 }}>
        {summary.suggestedInterviewTopics.map((topic) => (
          <li key={topic} style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.58)', marginBottom: 4 }}>
            {topic}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DifferentiatorsCard({ groups }: { groups: DifferentiatorGroup[] }) {
  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map((group) => (
        <div key={group.heading}>
          <MonoLabel>{group.heading.toUpperCase()}</MonoLabel>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {group.items.map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.82)' }}>{item.label}</div>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, marginTop: 4 }}>
                  {item.evidence}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
