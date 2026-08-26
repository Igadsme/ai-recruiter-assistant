import { useEffect, useState, type ReactNode } from 'react'
import { analyzeJob, type FitAnalysis } from '../../services/api'
import { MonoLabel, TechTag } from '../../components/ui'

export function FitPanel({
  onClose,
  onAsk,
  conversationId,
}: {
  onClose: () => void
  onAsk: (query: string) => void
  conversationId?: string
}) {
  const [jd, setJd] = useState('')
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      setAnalysis(await analyzeJob(jd, conversationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fit analysis failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Overlay title="FIT ANALYSIS" onClose={onClose}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
        Paste a job description. Matches are scored from the verified candidate file — not from model guesses.
      </p>
      <textarea
        value={jd}
        onChange={(event) => setJd(event.target.value)}
        placeholder="Software Engineer — Python, AWS, React, PostgreSQL..."
        aria-label="Job description"
        style={{
          width: '100%',
          minHeight: 120,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)',
          color: 'rgba(255,255,255,0.85)',
          padding: 12,
          fontSize: 13.5,
          resize: 'vertical',
        }}
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || jd.trim().length < 20}
        style={{
          marginTop: 10,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.12em',
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid rgba(110,168,255,0.3)',
          background: 'rgba(110,168,255,0.12)',
          color: 'rgba(180,210,255,0.9)',
          cursor: 'pointer',
        }}
      >
        {busy ? 'ANALYZING…' : 'ANALYZE FIT'}
      </button>
      {error && <p style={{ color: 'rgba(248,196,100,0.8)', marginTop: 10, fontSize: 13 }}>{error}</p>}
      {analysis && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MonoLabel>{analysis.roleHint}</MonoLabel>
          {typeof analysis.overallScore === 'number' && (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)' }}>
              Overall match <strong>{analysis.overallScore}/100</strong>
              {analysis.requiredCoverage && (
                <>
                  {' '}
                  · Required {analysis.requiredCoverage.percent}% · Preferred {analysis.preferredCoverage.percent}%
                </>
              )}
            </p>
          )}
          {analysis.whyInterview && (
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6 }}>{analysis.whyInterview}</p>
          )}
          <FitGroup title="Strong matches" color="rgba(74,222,128,0.7)">
            {analysis.strong.map((item) => (
              <div key={item.technology} style={{ marginBottom: 8 }}>
                <TechTag label={item.technology} />
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{item.evidence}</p>
              </div>
            ))}
          </FitGroup>
          <FitGroup title="Partial matches" color="rgba(248,196,100,0.7)">
            {analysis.partial.map((item) => (
              <div key={item.technology} style={{ marginBottom: 8 }}>
                <TechTag label={item.technology} />
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{item.evidence}</p>
              </div>
            ))}
          </FitGroup>
          <FitGroup title="Not demonstrated" color="rgba(255,255,255,0.4)">
            {analysis.missing.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>None from this posting.</p>
            ) : (
              analysis.missing.map((item) => <TechTag key={item} label={item} />)
            )}
          </FitGroup>
          {analysis.hiringRisks && analysis.hiringRisks.length > 0 && (
            <FitGroup title="Hiring risks" color="rgba(248,196,100,0.75)">
              {analysis.hiringRisks.map((risk) => (
                <p key={risk} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                  {risk}
                </p>
              ))}
            </FitGroup>
          )}
          <FitGroup title="Relevant projects" color="rgba(110,168,255,0.75)">
            {analysis.relevantProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onAsk(`Tell me about ${project.title}`)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: 8,
                }}
              >
                <strong>{project.title}</strong>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>{project.reason}</div>
              </button>
            ))}
          </FitGroup>
          <FitGroup title="Interview questions" color="rgba(110,168,255,0.75)">
            {analysis.interviewQuestions.map((question) => (
              <p key={question} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                {question}
              </p>
            ))}
          </FitGroup>
        </div>
      )}
    </Overlay>
  )
}

function FitGroup({
  title,
  color,
  children,
}: {
  title: string
  color: string
  children: ReactNode
}) {
  return (
    <div>
      <MonoLabel color={color}>{title.toUpperCase()}</MonoLabel>
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  )
}

export function Overlay({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(5,6,10,0.72)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflowY: 'auto',
        padding: '72px 16px 40px',
      }}
      onClick={onClose}
    >
      <div
        className="animate-scale-in"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          background: '#0c0c10',
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <MonoLabel>{title}</MonoLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
