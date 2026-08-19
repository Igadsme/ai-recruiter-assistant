import { useState } from 'react'
import { fetchAnalytics, type AnalyticsSummary } from '../services/api'
import { MonoLabel } from './ui'

export function AnalyticsDashboard() {
  const [key, setKey] = useState(() => sessionStorage.getItem('analytics-key') ?? '')
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const summary = await fetchAnalytics(key)
      sessionStorage.setItem('analytics-key', key)
      setData(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load analytics.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <MonoLabel>PRIVATE ANALYTICS</MonoLabel>
        <h1 style={{ fontSize: 28, fontWeight: 350, letterSpacing: '-0.04em', margin: '10px 0 18px' }}>
          Recruiter analytics
        </h1>
        {!data && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="Analytics key"
              aria-label="Analytics key"
              style={{
                flex: 1,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
                padding: '10px 12px',
              }}
            />
            <button
              type="button"
              onClick={() => void load()}
              style={{
                borderRadius: 10,
                border: '1px solid rgba(110,168,255,0.3)',
                background: 'rgba(110,168,255,0.12)',
                color: 'rgba(200,220,255,0.9)',
                padding: '0 16px',
                cursor: 'pointer',
              }}
            >
              Open
            </button>
          </div>
        )}
        {error && <p style={{ color: 'rgba(248,196,100,0.85)', marginTop: 12 }}>{error}</p>}
        {data && (
          <div style={{ marginTop: 24 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Last {data.windowDays} days</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <Stat label="Visitors" value={data.totals.visitors} />
              <Stat label="Chats started" value={data.totals.chatStarted} />
              <Stat label="Questions" value={data.totals.questions} />
              <Stat label="Resume viewed" value={data.totals.resumeViewed} />
              <Stat label="Resume downloaded" value={data.totals.resumeDownloaded} />
              <Stat label="Projects viewed" value={data.totals.projectViewed} />
              <Stat label="GitHub" value={data.totals.githubClicked} />
              <Stat label="Contact" value={data.totals.contactClicked} />
            </div>
            <div style={{ marginTop: 28 }}>
              <MonoLabel>MOST ASKED QUESTIONS</MonoLabel>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.mostAsked.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.35)' }}>No questions yet this window.</p>
                )}
                {data.mostAsked.map((item) => (
                  <div key={item.query} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                    {item.query} <span style={{ color: 'rgba(110,168,255,0.75)' }}>×{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 400 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
