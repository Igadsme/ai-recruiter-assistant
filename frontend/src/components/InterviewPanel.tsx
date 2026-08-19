import { useEffect, useState } from 'react'
import { fetchInterviewTracks, sendInterview, type InterviewResponse, type InterviewTrack } from '../services/api'
import { Overlay } from './FitPanel'
import { MonoLabel } from './ui'

export function InterviewPanel({ onClose }: { onClose: () => void }) {
  const [tracks, setTracks] = useState<InterviewTrack[]>([])
  const [active, setActive] = useState<InterviewResponse | null>(null)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void fetchInterviewTracks().then(setTracks).catch(() => undefined)
  }, [])

  const start = async (track: string) => {
    setBusy(true)
    try {
      setActive(await sendInterview({ track }))
      setAnswer('')
    } finally {
      setBusy(false)
    }
  }

  const follow = async () => {
    if (!active || !answer.trim()) return
    setBusy(true)
    try {
      setActive(await sendInterview({ track: active.track, message: answer, conversationId: active.conversationId }))
      setAnswer('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Overlay title="SIMULATE AN INTERVIEW" onClose={onClose}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
        Questions are grounded in verified roles and projects. The interviewer will follow up on your answer.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {tracks.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => void start(track.id)}
            disabled={busy}
            style={{
              fontSize: 12.5,
              padding: '7px 12px',
              borderRadius: 999,
              border: `1px solid ${active?.track === track.id ? 'rgba(110,168,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
              background: active?.track === track.id ? 'rgba(110,168,255,0.1)' : 'transparent',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            {track.label}
          </button>
        ))}
      </div>
      {active && (
        <div>
          <MonoLabel color="rgba(255,255,255,0.3)">{active.phase.toUpperCase()}</MonoLabel>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, margin: '10px 0 14px' }}>
            {active.question}
          </p>
          {active.phase !== 'wrap' && (
            <>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                aria-label="Interview answer"
                placeholder="Respond as Imani, or explore the work yourself…"
                style={{
                  width: '100%',
                  minHeight: 90,
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.85)',
                  padding: 12,
                  fontSize: 13.5,
                }}
              />
              <button
                type="button"
                onClick={() => void follow()}
                disabled={busy || !answer.trim()}
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
                {busy ? 'LISTENING…' : 'SEND ANSWER'}
              </button>
            </>
          )}
        </div>
      )}
    </Overlay>
  )
}
