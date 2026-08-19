import type { RecruiterSession } from '../services/api'
import { MonoLabel } from './ui'

export function RecruiterSessionPanel({
  session,
  onClose,
}: {
  session?: RecruiterSession
  onClose: () => void
}) {
  const data = session ?? {
    interests: [],
    questionsAsked: 0,
    projectsViewed: [],
    experienceViewed: [],
    resumeViewed: false,
    resumeDownloaded: false,
    githubClicked: false,
    contactClicked: false,
    exploring: 'Overview',
  }

  return (
    <aside
      className="animate-slide-in-right fixed right-0 top-0 bottom-0 flex flex-col"
      aria-label="Recruiter session"
      style={{
        width: 252,
        background: 'rgba(11,11,14,0.94)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 sticky top-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,11,14,0.92)' }}
      >
        <MonoLabel color="rgba(255,255,255,0.36)">SESSION</MonoLabel>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close session panel"
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-5 px-5 py-6">
        <div>
          <MonoLabel color="rgba(255,255,255,0.24)">EXPLORING</MonoLabel>
          <p style={{ fontSize: 13, color: 'rgba(110,168,255,0.85)', marginTop: 8 }}>{data.exploring}</p>
        </div>
        <FlagList title="Interests" items={data.interests} />
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>Questions asked: {data.questionsAsked}</p>
        <FlagList title="Projects viewed" items={data.projectsViewed} />
        <FlagList title="Experience viewed" items={data.experienceViewed} />
        <div>
          <MonoLabel color="rgba(255,255,255,0.24)">ACTIONS</MonoLabel>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.6 }}>
            Resume viewed: {data.resumeViewed ? 'Yes' : 'No'}
            <br />
            Resume downloaded: {data.resumeDownloaded ? 'Yes' : 'No'}
            <br />
            GitHub: {data.githubClicked ? 'Yes' : 'No'}
            <br />
            Contact: {data.contactClicked ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    </aside>
  )
}

function FlagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <MonoLabel color="rgba(255,255,255,0.24)">{title.toUpperCase()}</MonoLabel>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.length === 0 && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>None yet</span>
        )}
        {items.map((item) => (
          <span key={item} style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>
            ✓ {item}
          </span>
        ))}
      </div>
    </div>
  )
}
