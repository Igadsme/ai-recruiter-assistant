import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  DEFAULT_CHIPS,
  RECRUITER_CHIPS,
  THINKING_LABELS,
  CONTEXT_DATA,
  CANDIDATE,
  skipsThinkingState,
  type CannedResponse,
  type EvidenceItem,
} from './data'
import { getErrorMessage, sendChat, trackEvent, type ChatApiResponse, type ChatMode, type RecruiterSession } from './services/api'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis'
import { RecruiterBriefCard } from './components/RecruiterBrief'
import { ProjectDeepDiveCard } from './components/ProjectDeepDiveCard'
import { FitPanel } from './features/fit-analysis/FitPanel'
import { InterviewPanel } from './components/InterviewPanel'
import { CareerTimeline } from './components/CareerTimeline'
import { RecruiterSessionPanel } from './components/RecruiterSessionPanel'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { ContactCta, FollowUps, SourcesDisclosure } from './components/ChatExtras'
import { DifferentiatorsCard } from './components/RecruiterCards'
import { HeaderChip } from './components/ui'
import { RecruiterJourney } from './features/recruiter/RecruiterJourney'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState = 'idle' | 'thinking' | 'conversation'
type OrbState = 'idle' | 'thinking' | 'voice'

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  response?: CannedResponse
  error?: boolean
}

function toCannedResponse(result: ChatApiResponse, _query: string): CannedResponse {
  const evidence: EvidenceItem[] = (result.sources ?? [])
    .filter((source) => source.type === 'experience' || source.type === 'project')
    .map((source, index) => ({
      id: source.id ?? `${source.type}-${index}-${source.title}`,
      company: source.organization ?? source.title,
      role: source.type === 'project' ? 'Project' : source.title,
      period: source.date ?? '',
      description: source.relevantExcerpt ?? '',
      tags: source.technologies ?? [],
      metrics: source.metrics,
    }))

  const conversational = Boolean(result.conversational)

  return {
    intro: spokenText(result.message, { rewritePerson: !conversational }),
    sections: result.isResume ? result.sections ?? [] : [],
    evidence,
    isResume: result.isResume,
    sources: result.sources,
    verified: result.verified,
    verificationNote: result.verificationNote,
    followUps: result.followUps,
    retrievalStages: result.retrievalStages,
    recruiterSummary: result.recruiterSummary,
    projectDeepDive: result.projectDeepDive,
    differentiators: result.differentiators,
    showContactCta: result.showContactCta,
    session: result.session,
    conversational,
    revealSources: Boolean(result.revealSources),
  }
}

function spokenText(raw: string, options?: { rewritePerson?: boolean }): string {
  const rewritePerson = options?.rewritePerson !== false
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{')) return rewritePerson ? toThirdPersonReply(trimmed) : trimmed
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    for (const key of ['intro', 'Intro', 'message', 'Message']) {
      const value = parsed[key]
      if (typeof value === 'string' && value.trim() && !value.trim().startsWith('{')) {
        const spoken = value.trim()
        return rewritePerson ? toThirdPersonReply(spoken) : spoken
      }
    }
    if (Array.isArray(parsed.sections)) {
      return parsed.sections
        .map((section) =>
          section && typeof section === 'object' && 'body' in section
            ? String((section as { body?: unknown }).body ?? '')
            : '',
        )
        .filter(Boolean)
        .join('\n\n')
    }
  } catch {
    return rewritePerson ? toThirdPersonReply(trimmed) : trimmed
  }
  return rewritePerson ? toThirdPersonReply(trimmed) : trimmed
}

function toThirdPersonReply(text: string): string {
  let out = text.trim()
  if (/\bI['’]m Imani['’]s AI assistant\b/i.test(out) || /\bI am Imani['’]s AI assistant\b/i.test(out)) {
    return out
  }
  if (/^I['’]m\b/i.test(out)) out = out.replace(/^I['’]m\b/i, 'Imani is')
  else if (/^I am\b/i.test(out)) out = out.replace(/^I am\b/i, 'Imani is')
  else if (/^I['’]ve\b/i.test(out)) out = out.replace(/^I['’]ve\b/i, 'Imani has')
  else if (/^My name is\b/i.test(out)) out = out.replace(/^My name is\b/i, 'Imani is')
  else if (/^My\b/i.test(out)) out = out.replace(/^My\b/i, "Imani's")
  else if (/^I\b/i.test(out)) out = out.replace(/^I\b/i, 'Imani')

  out = out.replace(/([.!?]\s+)I\b/g, '$1He')
  return out
    .replace(/\bI['’]m\b/g, "he's")
    .replace(/\bI am\b/g, 'he is')
    .replace(/\bI['’]ve\b/g, 'he has')
    .replace(/\bI['’]d\b/g, "he'd")
    .replace(/\bI['’]ll\b/g, "he'll")
    .replace(/\bI\b/g, 'he')
    .replace(/\bme\b/g, 'him')
    .replace(/\bmyself\b/g, 'himself')
    .replace(/\b[Mm]y\b/g, 'his')
    .replace(/\bmine\b/g, 'his')
}

function VerifiedBadgeNote({ note }: { note: string }) {
  return (
    <p style={{ fontSize: 12.5, color: 'rgba(248,196,100,0.75)', marginBottom: 10, lineHeight: 1.5 }}>
      {note}
    </p>
  )
}

function WorkInProgressFooter({
  insetRight,
  onResume,
}: {
  insetRight: number
  onResume: () => void
}) {
  const [contactOpen, setContactOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contactOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContactOpen(false)
    }
    const onPointer = (event: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setContactOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [contactOpen])

  const linkStyle: React.CSSProperties = {
    color: 'rgba(150,180,255,0.92)',
    textDecoration: 'none',
    wordBreak: 'break-all',
  }

  return (
    <footer
      ref={contactRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: insetRight,
        zIndex: 50,
        padding: '8px 20px 10px',
        background: 'rgba(9,9,11,0.92)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        transition: 'right 0.38s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {contactOpen && (
        <div
          role="dialog"
          aria-label="Imani Gad's contact information"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(360px, calc(100% - 32px))',
            padding: '14px 16px 16px',
            background: 'rgba(14,14,18,0.98)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.42)',
            }}
          >
            CONTACT
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ContactRow label="Email">
              <a href={`mailto:${CANDIDATE.email}`} style={linkStyle}>
                {CANDIDATE.email}
              </a>
            </ContactRow>
            <ContactRow label="Phone number">
              <a href={`tel:${CANDIDATE.phone.replace(/-/g, '')}`} style={linkStyle}>
                {CANDIDATE.phone}
              </a>
            </ContactRow>
            <ContactRow label="LinkedIn">
              <a
                href={CANDIDATE.linkedin}
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
              >
                {CANDIDATE.linkedin}
              </a>
            </ContactRow>
          </div>
        </div>
      )}
      <p
        style={{
          margin: 0,
          textAlign: 'center',
          fontSize: 11.5,
          lineHeight: 1.45,
          fontWeight: 380,
          color: 'rgba(255,255,255,0.38)',
          letterSpacing: '-0.01em',
          maxWidth: 720,
          marginInline: 'auto',
        }}
      >
        Work in Progress: I'm still learning the ropes! If I ever get confused or hallucinate
        details, check out Imani's{' '}
        <button
          type="button"
          onClick={() => {
            setContactOpen(false)
            onResume()
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'rgba(150,180,255,0.85)',
            textDecoration: 'underline',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          official resume
        </button>{' '}
        above or{' '}
        <button
          type="button"
          onClick={() => setContactOpen((open) => !open)}
          aria-expanded={contactOpen}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'rgba(150,180,255,0.85)',
            textDecoration: 'underline',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          reach out to him directly
        </button>
        .
      </p>
    </footer>
  )
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.40)',
          fontWeight: 450,
        }}
      >
        {label}:
      </span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.35 }}>
        {children}
      </span>
    </div>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useOrbSize() {
  const [size, setSize] = useState(200)
  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? 148 : 200)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

// ─── Canvas Orb ───────────────────────────────────────────────────────────────

function Orb({ orbState }: { orbState: OrbState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const orbStateRef = useRef<OrbState>(orbState)
  const animRef = useRef<number>(0)
  const size = useOrbSize()

  useEffect(() => { orbStateRef.current = orbState }, [orbState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r = size * 0.344

    let t = 0
    let ring1 = 0
    let ring2 = Math.PI * 0.22

    const ring = (rx: number, angle: number, alpha: number) => {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.ellipse(0, 0, rx, rx * 0.21, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(112,168,255,${alpha})`
      ctx.lineWidth = 0.75
      ctx.stroke()
      ctx.restore()
    }

    const draw = () => {
      const st = orbStateRef.current
      ctx.clearRect(0, 0, size, size)

      const breathSpd = st === 'voice' ? 4.2 : st === 'thinking' ? 2.5 : 0.88
      const breathAmp = st === 'voice' ? 0.058 : st === 'thinking' ? 0.04 : 0.017
      const scale = 1 + Math.sin(t * breathSpd) * breathAmp

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(scale, scale)
      ctx.translate(-cx, -cy)

      // Outer ambient glow
      const ga = st === 'thinking'
        ? 0.085 + Math.sin(t * 2.5) * 0.042
        : st === 'voice'
          ? 0.10 + Math.sin(t * 4.2) * 0.052
          : 0.042
      const gOut = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r * 2.55)
      gOut.addColorStop(0, `rgba(86,134,255,${ga})`)
      gOut.addColorStop(0.45, `rgba(86,134,255,${ga * 0.28})`)
      gOut.addColorStop(1, 'rgba(86,134,255,0)')
      ctx.fillStyle = gOut
      ctx.beginPath()
      ctx.arc(cx, cy, r * 2.55, 0, Math.PI * 2)
      ctx.fill()

      // Sphere base gradient
      const gBase = ctx.createRadialGradient(cx - r * 0.31, cy - r * 0.30, r * 0.01, cx, cy, r)
      gBase.addColorStop(0,    'rgba(168,202,255,0.13)')
      gBase.addColorStop(0.28, 'rgba(112,158,255,0.09)')
      gBase.addColorStop(0.58, 'rgba(72,108,232,0.06)')
      gBase.addColorStop(0.80, 'rgba(46,70,195,0.04)')
      gBase.addColorStop(1,    'rgba(22,40,135,0.025)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gBase
      ctx.fill()

      // Rim border
      ctx.strokeStyle = 'rgba(145,192,255,0.13)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Specular highlight (top-left)
      const gSpec = ctx.createRadialGradient(cx - r * 0.335, cy - r * 0.295, 0, cx - r * 0.335, cy - r * 0.295, r * 0.55)
      gSpec.addColorStop(0, 'rgba(255,255,255,0.20)')
      gSpec.addColorStop(0.40, 'rgba(218,235,255,0.05)')
      gSpec.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gSpec
      ctx.fill()

      // Secondary micro-highlight (smaller, tighter)
      const gSpec2 = ctx.createRadialGradient(cx - r * 0.18, cy - r * 0.38, 0, cx - r * 0.18, cy - r * 0.38, r * 0.16)
      gSpec2.addColorStop(0, 'rgba(255,255,255,0.10)')
      gSpec2.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gSpec2
      ctx.fill()

      // Rim light bottom-right
      const gRim = ctx.createRadialGradient(cx + r * 0.62, cy + r * 0.58, r * 0.10, cx + r * 0.62, cy + r * 0.58, r * 0.84)
      gRim.addColorStop(0, 'rgba(100,165,255,0.09)')
      gRim.addColorStop(1, 'rgba(100,165,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gRim
      ctx.fill()

      // Depth shadow bottom-right interior
      const gDep = ctx.createRadialGradient(cx + r * 0.38, cy + r * 0.34, 0, cx + r * 0.38, cy + r * 0.34, r * 0.58)
      gDep.addColorStop(0, 'rgba(0,5,28,0.22)')
      gDep.addColorStop(1, 'rgba(0,5,28,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gDep
      ctx.fill()

      // Inner core glow (pulsing)
      const ci = st === 'thinking'
        ? 0.128 + Math.sin(t * 2.5) * 0.056
        : st === 'voice'
          ? 0.115 + Math.sin(t * 4.2) * 0.062
          : 0.056 + Math.sin(t * 0.88) * 0.018
      const gCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.64)
      gCore.addColorStop(0, `rgba(138,180,255,${ci})`)
      gCore.addColorStop(0.6, `rgba(138,180,255,${ci * 0.4})`)
      gCore.addColorStop(1, 'rgba(138,180,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.64, 0, Math.PI * 2)
      ctx.fillStyle = gCore
      ctx.fill()

      ctx.restore()

      // Orbital rings (outside breathing transform)
      const ra1 = st === 'thinking' ? 0.095 + Math.sin(t * 1.65) * 0.042 : 0.068
      const ra2 = st === 'thinking' ? 0.060 + Math.sin(t * 1.95) * 0.030 : 0.038
      ring(r * 1.295, ring1, ra1)
      ring(r * 1.460, ring2 + Math.PI * 0.26, ra2)

      // Floating orbital particles
      for (let i = 0; i < 6; i++) {
        const pAng = (i / 6) * Math.PI * 2 + t * 0.30 + i * 0.58
        const pDist = r * (1.62 + i * 0.11)
        const px = cx + Math.cos(pAng) * pDist
        const py = cy + Math.sin(pAng) * pDist * 0.36
        const base = 0.26 + Math.sin(t * 0.88 + i * 1.18) * 0.13
        const mul = st === 'thinking' ? 1.7 : st === 'voice' ? 1.4 : 0.75
        ctx.beginPath()
        ctx.arc(px, py, 1.25, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(115,172,255,${Math.min(base * mul, 0.78)})`
        ctx.fill()
      }

      t += 0.016
      ring1 += 0.0040
      ring2 -= 0.0026

      if (typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
        animRef.current = requestAnimationFrame(draw)
      }
    }

    draw()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [size])

  return <canvas ref={canvasRef} style={{ display: 'block', imageRendering: 'crisp-edges' }} />
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function TechTag({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10.5,
        color: 'rgba(200,218,255,0.55)',
        background: 'rgba(100,150,255,0.07)',
        border: '1px solid rgba(100,150,255,0.14)',
        borderRadius: 5,
        padding: '2px 8px',
        letterSpacing: '0.02em',
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  )
}

function MetricTag({ label }: { label: string }) {
  const pos = label.startsWith('+')
  const neg = label.startsWith('-')
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10.5,
        fontWeight: 500,
        color: pos
          ? 'rgba(74,222,128,0.88)'
          : neg
            ? 'rgba(110,168,255,0.88)'
            : 'rgba(248,196,100,0.88)',
        background: pos
          ? 'rgba(74,222,128,0.07)'
          : neg
            ? 'rgba(110,168,255,0.07)'
            : 'rgba(248,196,100,0.07)',
        border: `1px solid ${pos ? 'rgba(74,222,128,0.18)' : neg ? 'rgba(110,168,255,0.18)' : 'rgba(248,196,100,0.18)'}`,
        borderRadius: 5,
        padding: '2px 8px',
        letterSpacing: '0.02em',
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  )
}

function MonoLabel({
  children,
  color = 'rgba(110,162,255,0.65)',
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 9.5,
        fontWeight: 500,
        letterSpacing: '0.15em',
        color,
      }}
    >
      {children}
    </span>
  )
}

// ─── Resume card ──────────────────────────────────────────────────────────────

function ResumeCard() {
  const [previewing, setPreviewing] = useState(false)

  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid rgba(110,168,255,0.22)',
        background: 'rgba(110,168,255,0.05)',
        overflow: 'hidden',
        marginTop: 20,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
        }}
      >
        {/* PDF icon */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'rgba(110,168,255,0.12)',
            border: '1px solid rgba(110,168,255,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
            <path
              d="M10.5 1H3C2.17 1 1.5 1.67 1.5 2.5v15C1.5 18.33 2.17 19 3 19h12c.83 0 1.5-.67 1.5-1.5V7L10.5 1z"
              stroke="rgba(110,168,255,0.7)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path d="M10.5 1v6h6" stroke="rgba(110,168,255,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="5" y1="13" x2="13" y2="13" stroke="rgba(110,168,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="5" y1="10" x2="13" y2="10" stroke="rgba(110,168,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.82)',
              letterSpacing: '-0.01em',
              marginBottom: 3,
            }}
          >
            Imani Gad
          </p>
          <MonoLabel color="rgba(255,255,255,0.32)">
            B.S. COMPUTER SCIENCE · KSU · DEC 2026
          </MonoLabel>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => {
              setPreviewing((p) => !p)
              if (!previewing) void trackEvent('resume_viewed')
            }}
            aria-expanded={previewing}
            aria-label={previewing ? 'Close resume preview' : 'Preview resume'}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              letterSpacing: '0.12em',
              color: previewing ? 'rgba(110,168,255,0.88)' : 'rgba(255,255,255,0.42)',
              background: previewing ? 'rgba(110,168,255,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${previewing ? 'rgba(110,168,255,0.28)' : 'rgba(255,255,255,0.10)'}`,
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {previewing ? 'CLOSE' : 'PREVIEW'}
          </button>

          <a
            href="/IMANI_GAD.pdf"
            download="Imani_Gad_Resume.pdf"
            onClick={() => void trackEvent('resume_downloaded')}
            aria-label="Download Imani Gad resume PDF"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              letterSpacing: '0.12em',
              color: 'rgba(110,168,255,0.90)',
              background: 'rgba(110,168,255,0.13)',
              border: '1px solid rgba(110,168,255,0.30)',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(110,168,255,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(110,168,255,0.13)')}
          >
            DOWNLOAD
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v6M2 5l3 3 3-3" stroke="rgba(110,168,255,0.9)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* PDF preview */}
      {previewing && (
        <div
          className="animate-fade-in"
          style={{ borderTop: '1px solid rgba(110,168,255,0.14)' }}
        >
          <iframe
            src="/IMANI_GAD.pdf"
            width="100%"
            height="680"
            title="Imani Gad Resume"
            style={{ display: 'block', border: 'none' }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Evidence card ─────────────────────────────────────────────────────────────

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${open ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.07)'}`,
        background: open ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left px-4 py-3 flex items-start gap-3 group"
        style={{ cursor: 'pointer', background: 'none', border: 'none' }}
      >
        {/* Left accent bar */}
        <div
          style={{
            width: 2,
            minHeight: 16,
            alignSelf: 'stretch',
            borderRadius: 1,
            background: open ? 'rgba(110,168,255,0.5)' : 'rgba(110,168,255,0.2)',
            flexShrink: 0,
            transition: 'background 0.2s',
            marginTop: 2,
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.78)',
                letterSpacing: '-0.01em',
              }}
            >
              {item.company}
            </span>
            <MonoLabel color="rgba(255,255,255,0.28)">{item.role}</MonoLabel>
          </div>

          {!open && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.tags.slice(0, 5).map((t) => (
                <TechTag key={t} label={t} />
              ))}
              {item.metrics?.slice(0, 2).map((m) => (
                <MetricTag key={m} label={m} />
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            color: 'rgba(255,255,255,0.22)',
            fontSize: 9,
            marginTop: 3,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s ease',
            flexShrink: 0,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.05em',
          }}
        >
          {open ? 'HIDE' : 'MORE'}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }} />
          <MonoLabel color="rgba(255,255,255,0.28)">{item.period}</MonoLabel>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.60)',
              lineHeight: 1.68,
              marginTop: 8,
              marginBottom: 12,
            }}
          >
            {item.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <TechTag key={t} label={t} />
            ))}
            {item.metrics?.map((m) => (
              <MetricTag key={m} label={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Assistant message ─────────────────────────────────────────────────────────

function AssistantMessage({
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

  const [displayedIntro, setDisplayedIntro] = useState(isNew ? '' : fullIntro)
  const [visibleSections, setVisibleSections] = useState(isNew ? 0 : sections.length)
  const [evidenceVisible, setEvidenceVisible] = useState(!isNew)
  const [streaming, setStreaming] = useState(isNew)
  const { speak, supported } = useSpeechSynthesis()

  useEffect(() => {
    if (!isNew) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
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
      setDisplayedIntro(words.slice(0, i).join(''))
      if (i >= words.length) {
        clearInterval(iv)
        setStreaming(false)
        sections.forEach((_, idx) => {
          setTimeout(() => setVisibleSections((v) => Math.max(v, idx + 1)), (idx + 1) * 180)
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
    <div
      className="animate-fade-up"
      style={{ width: '100%', maxWidth: 680 }}
    >
      <p
        className={streaming ? 'streaming-cursor' : ''}
        style={{
          fontSize: 15,
          fontWeight: 380,
          color: 'rgba(255,255,255,0.84)',
          lineHeight: 1.75,
          letterSpacing: '-0.012em',
          whiteSpace: 'pre-wrap',
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
                background: 'rgba(255,255,255,0.027)',
                border: '1px solid rgba(255,255,255,0.075)',
                padding: '14px 16px',
              }}
            >
              {/* Section header row */}
              <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
                <MonoLabel>{s.label}</MonoLabel>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.055)' }} />
              </div>

              {s.body && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.58)',
                    lineHeight: 1.65,
                    marginBottom: s.tags.length || s.metrics?.length ? 10 : 0,
                  }}
                >
                  {s.body}
                </p>
              )}

              {(s.tags.length > 0 || (s.metrics?.length ?? 0) > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((t) => <TechTag key={t} label={t} />)}
                  {s.metrics?.map((m) => <MetricTag key={m} label={m} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {r && evidenceVisible && (
        <>
          {r.differentiators && <DifferentiatorsCard groups={r.differentiators} />}
          {r.projectDeepDive && <ProjectDeepDiveCard project={r.projectDeepDive} />}
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
      {evidence.length > 0 && evidenceVisible && sources.length === 0 && !r?.conversational && (
        <div className="animate-fade-in" style={{ marginTop: 20 }}>
          <div
            className="flex items-center gap-3"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.055)',
              paddingTop: 16,
              marginBottom: 10,
            }}
          >
            <MonoLabel color="rgba(255,255,255,0.24)">EVIDENCE</MonoLabel>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.045)' }} />
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

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-in">
      <div
        style={{
          maxWidth: 400,
          background: 'rgba(110,168,255,0.09)',
          border: '1px solid rgba(110,168,255,0.18)',
          borderRadius: 16,
          padding: '10px 16px',
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.82)',
            lineHeight: 1.55,
            letterSpacing: '-0.01em',
          }}
        >
          {text}
        </p>
      </div>
    </div>
  )
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <div
      role="alert"
      className="animate-fade-up"
      style={{ width: '100%', maxWidth: 680 }}
    >
      <MonoLabel color="rgba(248,196,100,0.70)">ERROR</MonoLabel>
      <p
        style={{
          fontSize: 15,
          fontWeight: 380,
          color: 'rgba(255,255,255,0.72)',
          lineHeight: 1.75,
          letterSpacing: '-0.012em',
          marginTop: 8,
        }}
      >
        {text}
      </p>
    </div>
  )
}

// ─── Chat input ────────────────────────────────────────────────────────────────

function ChatInput({
  onSubmit,
  onVoice,
  autoFocus = false,
  disabled = false,
}: {
  onSubmit: (q: string) => void
  onVoice: () => void
  autoFocus?: boolean
  disabled?: boolean
}) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 80)
  }, [autoFocus])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const submit = useCallback(() => {
    if (disabled || !value.trim()) return
    onSubmit(value.trim())
    setValue('')
  }, [value, onSubmit, disabled])

  const handleKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.04)',
        border: focused
          ? '1px solid rgba(110,168,255,0.28)'
          : '1px solid rgba(255,255,255,0.10)',
        boxShadow: focused
          ? '0 0 0 3px rgba(110,168,255,0.07), 0 8px 40px rgba(0,0,0,0.35)'
          : '0 4px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Mic */}
      <button
        type="button"
        onClick={onVoice}
        disabled={disabled}
        title="Voice mode"
        aria-label="Start voice input"
        style={{
          flexShrink: 0,
          marginLeft: 16,
          marginRight: 4,
          opacity: 0.35,
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.65')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.35')}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect x="4.5" y="1" width="6" height="8.5" rx="3" fill="currentColor" opacity="0.85" />
          <path d="M2.5 7.5c0 2.76 2.24 5 5 5s5-2.24 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <line x1="7.5" y1="12.5" x2="7.5" y2="14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {/* Input */}
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Ask about Imani Gad..."
        aria-label="Ask about Imani Gad"
        disabled={disabled}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          fontSize: 14.5,
          color: 'rgba(255,255,255,0.86)',
          letterSpacing: '-0.012em',
          padding: '15px 10px',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      />

      {/* ⌘K badge */}
      {!value && (
        <div style={{ flexShrink: 0, marginRight: 12, opacity: 0.28 }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 5,
              padding: '3px 6px',
              letterSpacing: '0.06em',
            }}
          >
            ⌘K
          </span>
        </div>
      )}

      {/* Send */}
      {value && (
        <button
          onClick={submit}
          aria-label="Send question"
          disabled={disabled}
          style={{
            flexShrink: 0,
            marginRight: 10,
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'rgba(110,168,255,0.22)',
            border: '1px solid rgba(110,168,255,0.38)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s, opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(110,168,255,0.34)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(110,168,255,0.22)')}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5h9M8 3l4 3.5-4 3.5" stroke="rgba(160,200,255,0.92)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Suggested chips ───────────────────────────────────────────────────────────

function SuggestedChips({
  chips,
  onSelect,
}: {
  chips: string[]
  onSelect: (q: string) => void
}) {
  return (
    <div
      className="chip-scroll flex flex-wrap justify-center gap-2 overflow-x-auto sm:flex-wrap sm:justify-center"
      style={{ maxWidth: 600 }}
    >
      {chips.map((chip, i) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="chip-enter flex-shrink-0"
          aria-label={`Ask: ${chip}`}
          style={{
            animationDelay: `${i * 45}ms`,
            fontSize: 12.5,
            color: 'rgba(255,255,255,0.46)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 999,
            padding: '7px 15px',
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: 'border-color 0.18s, color 0.18s, background 0.18s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.055)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.46)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

// ─── Thinking view ─────────────────────────────────────────────────────────────

function ThinkingView({ lastQuery }: { lastQuery: string }) {
  const [idx, setIdx] = useState(0)
  const [key, setKey] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      setIdx((i) => (i + 1) % THINKING_LABELS.length)
      setKey((k) => k + 1)
    }, 1900)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="flex flex-col items-center gap-8 animate-fade-up">
      <Orb orbState="thinking" />

      {lastQuery && (
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.22)',
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
            maxWidth: 340,
            textAlign: 'center',
            lineHeight: 1.55,
          }}
        >
          &ldquo;{lastQuery}&rdquo;
        </p>
      )}

      <div className="flex flex-col items-center gap-2" role="status" aria-live="polite">
        <MonoLabel color="rgba(255,255,255,0.28)">THINKING</MonoLabel>
        <div key={key} className="animate-label" style={{ height: 16, display: 'flex', alignItems: 'center' }}>
          <MonoLabel color="rgba(110,168,255,0.60)">{THINKING_LABELS[idx]}</MonoLabel>
        </div>
      </div>
    </div>
  )
}

// ─── Voice view ────────────────────────────────────────────────────────────────

function VoiceView({
  onStop,
  supported,
  listening,
  muted,
  transcript,
  onToggleMute,
}: {
  onStop: () => void
  supported: boolean
  listening: boolean
  muted: boolean
  transcript: string
  onToggleMute: () => void
}) {
  const status = !supported
    ? 'Voice is not supported in this browser'
    : muted
      ? 'Muted'
      : listening
        ? 'Listening…'
        : 'Microphone paused'

  return (
    <div className="flex flex-col items-center gap-8 animate-fade-up">
      <Orb orbState="voice" />
      <div className="flex flex-col items-center gap-1">
        <p
          role="status"
          aria-live="polite"
          style={{
            fontSize: 16,
            fontWeight: 340,
            color: 'rgba(255,255,255,0.72)',
            letterSpacing: '-0.02em',
            textAlign: 'center',
          }}
        >
          {status}
        </p>
        {transcript && (
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.38)',
              maxWidth: 360,
              textAlign: 'center',
              lineHeight: 1.55,
              marginTop: 8,
            }}
          >
            {transcript}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <Btn
          onClick={onToggleMute}
          active={muted}
          label={muted ? 'UNMUTE' : 'MUTE'}
        />
        <Btn onClick={onStop} label="STOP" />
      </div>
    </div>
  )
}

function Btn({
  onClick,
  label,
  active,
}: {
  onClick: () => void
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.14em',
        color: active ? 'rgba(110,168,255,0.88)' : 'rgba(255,255,255,0.46)',
        background: active ? 'rgba(110,168,255,0.10)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(110,168,255,0.28)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 999,
        padding: '8px 18px',
        cursor: 'pointer',
        transition: 'all 0.18s',
      }}
    >
      {label}
    </button>
  )
}

// ─── Context panel ─────────────────────────────────────────────────────────────

function ContextPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <aside
      className="animate-slide-in-right fixed right-0 top-0 bottom-0 flex flex-col"
      aria-label="Candidate context"
      style={{
        width: 252,
        background: 'rgba(11,11,14,0.94)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(36px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(36px) saturate(1.5)',
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 sticky top-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(11,11,14,0.92)',
        }}
      >
        <MonoLabel color="rgba(255,255,255,0.36)">CONTEXT</MonoLabel>
        <button
          onClick={onClose}
          aria-label="Close context panel"
          style={{
            color: 'rgba(255,255,255,0.28)',
            fontSize: 18,
            lineHeight: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 2px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 px-5 py-6">
        <CtxSection
          title="EXPERIENCE"
          items={CONTEXT_DATA.experience}
          dot="rgba(110,168,255,0.7)"
        />
        <CtxSection
          title="PROJECTS"
          items={CONTEXT_DATA.projects}
          dot="rgba(74,222,128,0.65)"
        />
        <CtxSection
          title="SKILLS"
          items={CONTEXT_DATA.skills}
          dot="rgba(248,196,100,0.65)"
        />
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8.5,
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.12em',
            lineHeight: 1.7,
            textTransform: 'uppercase',
          }}
        >
          Responses grounded in
          <br />
          Imani Gad's verified data
        </p>
      </div>
    </aside>
  )
}

function CtxSection({
  title,
  items,
  dot,
}: {
  title: string
  items: string[]
  dot: string
}) {
  return (
    <div>
      <MonoLabel color="rgba(255,255,255,0.24)">{title}</MonoLabel>
      <div className="flex flex-col gap-1.5" style={{ marginTop: 10 }}>
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: dot,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.48)',
                letterSpacing: '-0.01em',
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Idle chips for conversation (compact) ─────────────────────────────────────

function ConversationChips({
  chips,
  onSelect,
}: {
  chips: string[]
  onSelect: (q: string) => void
}) {
  return (
    <div className="chip-scroll flex gap-2 overflow-x-auto">
      {chips.slice(0, 5).map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="flex-shrink-0"
          aria-label={`Ask: ${chip}`}
          style={{
            fontSize: 11.5,
            color: 'rgba(255,255,255,0.36)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 999,
            padding: '5px 12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.62)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.36)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/analytics')) {
    return <AnalyticsDashboard />
  }

  return <AssistantShell />
}

function AssistantShell() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [latestAssistantId, setLatestAssistantId] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [isRecruiterMode, setIsRecruiterMode] = useState(false)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [voiceMuted, setVoiceMuted] = useState(false)
  const [voiceOut, setVoiceOut] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [session, setSession] = useState<RecruiterSession | undefined>(undefined)
  const [overlay, setOverlay] = useState<'fit' | 'interview' | 'timeline' | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const speech = useSpeechRecognition({ active: isVoiceMode, muted: voiceMuted })

  useEffect(() => {
    if (sessionStorage.getItem('visit-tracked') === '1') return
    sessionStorage.setItem('visit-tracked', '1')
    void trackEvent('portfolio_visit')
  }, [])

  const chips = isRecruiterMode ? RECRUITER_CHIPS : DEFAULT_CHIPS
  const mode: ChatMode = isRecruiterMode ? 'recruiter' : 'general'
  const lastFollowUps = [...messages].reverse().find((msg) => msg.role === 'assistant' && msg.response?.followUps)?.response?.followUps
  const convoChips = lastFollowUps && lastFollowUps.length > 0 ? lastFollowUps : chips

  const handleQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return
      if (appState === 'thinking') return
      if (isVoiceMode) {
        setIsVoiceMode(false)
        setVoiceMuted(false)
      }
      setLastQuery(trimmed)
      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: trimmed }
      setMessages((prev) => [...prev, userMsg])
      const casual = skipsThinkingState(trimmed)
      setAppState(casual ? 'conversation' : 'thinking')

      try {
        const result = await sendChat({
          message: trimmed,
          conversationId,
          mode,
        })
        setConversationId(result.conversationId)
        if (result.session) setSession(result.session)
        if (messages.length === 0) void trackEvent('chat_started')
        const response = toCannedResponse(result, trimmed)
        const aMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: response.intro,
          response,
        }
        setMessages((prev) => [...prev, aMsg])
        setLatestAssistantId(aMsg.id)
        setAppState('conversation')
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
      } catch (error) {
        const mapped = getErrorMessage(error)
        const aMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: mapped.message,
          error: true,
        }
        setMessages((prev) => [...prev, aMsg])
        setLatestAssistantId(aMsg.id)
        setAppState('conversation')
      }
    },
    [appState, isVoiceMode, conversationId, mode, messages.length],
  )

  const handleNew = () => {
    setMessages([])
    setLatestAssistantId(null)
    setAppState('idle')
    setIsContextOpen(false)
    setConversationId(undefined)
    setSession(undefined)
  }

  const handleVoiceStop = () => {
    const spoken = speech.transcript.trim()
    speech.stop()
    setIsVoiceMode(false)
    setVoiceMuted(false)
    if (spoken) handleQuery(spoken)
  }

  const inConvo = appState === 'conversation'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#09090b',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {/* Background radial light source */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 75% 55% at 50% -8%, rgba(75,110,220,0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── Header ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          background: inConvo ? 'rgba(9,9,11,0.75)' : 'transparent',
          borderBottom: inConvo ? '1px solid rgba(255,255,255,0.055)' : 'none',
          backdropFilter: inConvo ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: inConvo ? 'blur(16px)' : 'none',
          transition: 'background 0.4s, border-color 0.4s, backdrop-filter 0.4s',
        }}
      >
        {/* Left: brand + new */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: inConvo ? 1 : 0.55 }}>
            <div
              className="animate-status-pulse"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(110,168,255,0.85)',
                boxShadow: '0 0 8px rgba(110,168,255,0.5)',
                flexShrink: 0,
              }}
            />
            <MonoLabel color="rgba(255,255,255,0.38)">IMANI GAD · AI</MonoLabel>
          </div>

          {inConvo && (
            <button
              onClick={handleNew}
              aria-label="Start a new conversation"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9.5,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.28)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}
            >
              ← NEW
            </button>
          )}
        </div>

        {/* Right: recruiter + context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <HeaderChip
            active={isRecruiterMode}
            onClick={() => setIsRecruiterMode((r) => !r)}
            label="Toggle recruiter mode"
          >
            RECRUITER
          </HeaderChip>
          <HeaderChip active={overlay === 'fit'} onClick={() => setOverlay('fit')} label="Open fit analysis">
            FIT
          </HeaderChip>
          <HeaderChip active={overlay === 'interview'} onClick={() => setOverlay('interview')} label="Simulate an interview">
            INTERVIEW
          </HeaderChip>
          <HeaderChip active={overlay === 'timeline'} onClick={() => setOverlay('timeline')} label="Open career timeline">
            TIMELINE
          </HeaderChip>
          <HeaderChip active={voiceOut} onClick={() => setVoiceOut((value) => !value)} label="Toggle spoken answers">
            {voiceOut ? 'VOICE' : 'TEXT'}
          </HeaderChip>

          {inConvo && (
            <button
              onClick={() => setIsContextOpen((o) => !o)}
              aria-pressed={isContextOpen}
              aria-label="Toggle recruiter session panel"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.12em',
                color: isContextOpen ? 'rgba(110,168,255,0.88)' : 'rgba(255,255,255,0.38)',
                background: isContextOpen ? 'rgba(110,168,255,0.10)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isContextOpen ? 'rgba(110,168,255,0.26)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              SESSION
            </button>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main
        id="main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 64,
          paddingRight: isContextOpen ? 252 : 0,
          transition: 'padding-right 0.38s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* ── Idle ── */}
        {appState === 'idle' && !isVoiceMode && (
          <div
            className="animate-fade-up"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px 96px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 28,
                width: '100%',
                maxWidth: isRecruiterMode ? 640 : 580,
              }}
            >
              {!isRecruiterMode && <Orb orbState="idle" />}

              {isRecruiterMode ? (
                <RecruiterBriefCard
                  onAsk={() => {
                    const el = document.querySelector<HTMLInputElement>('[aria-label="Ask about Imani Gad"]')
                    el?.focus()
                  }}
                  onFit={() => setOverlay('fit')}
                  onInterview={() => setOverlay('interview')}
                  onTimeline={() => setOverlay('timeline')}
                />
              ) : (
              <div style={{ textAlign: 'center' }}>
                <h1
                  style={{
                    fontSize: 'clamp(30px, 5.5vw, 44px)',
                    fontWeight: 250,
                    color: 'rgba(255,255,255,0.88)',
                    letterSpacing: '-0.045em',
                    lineHeight: 1.08,
                    marginBottom: 10,
                  }}
                >
                  How can I help?
                </h1>
                <p
                  style={{
                    fontSize: 13.5,
                    color: 'rgba(255,255,255,0.30)',
                    letterSpacing: '-0.01em',
                    fontWeight: 380,
                    marginBottom: 18,
                  }}
                >
                  I'm Imani's AI assistant — ask about his experience, or pick a path below.
                </p>
                <RecruiterJourney
                  onMeet={() => void handleQuery('Who is Imani?')}
                  onEvaluate={() => setOverlay('fit')}
                  onExplore={() => setOverlay('timeline')}
                />
              </div>
              )}

              <div style={{ width: '100%' }}>
                <ChatInput
                  onSubmit={handleQuery}
                  onVoice={() => setIsVoiceMode(true)}
                  autoFocus
                  disabled={appState === 'thinking'}
                />
              </div>

              <SuggestedChips chips={chips} onSelect={handleQuery} />
            </div>
          </div>
        )}

        {/* ── Voice ── */}
        {isVoiceMode && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px 96px',
            }}
          >
            <VoiceView
              onStop={handleVoiceStop}
              supported={speech.supported}
              listening={speech.listening}
              muted={voiceMuted}
              transcript={speech.transcript}
              onToggleMute={() => setVoiceMuted((value) => !value)}
            />
          </div>
        )}

        {/* ── Thinking ── */}
        {appState === 'thinking' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px 96px',
            }}
          >
            <ThinkingView lastQuery={lastQuery} />
          </div>
        )}

        {/* ── Conversation ── */}
        {appState === 'conversation' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Message list */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingBottom: 220,
              }}
            >
              <div
                style={{
                  maxWidth: 740,
                  margin: '0 auto',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 32,
                }}
              >
                {messages.map((msg) =>
                  msg.role === 'user' ? (
                    <UserMessage key={msg.id} text={msg.text} />
                  ) : msg.error ? (
                    <ErrorMessage key={msg.id} text={msg.text} />
                  ) : (
                    <AssistantMessage
                      key={msg.id}
                      msg={msg}
                      isNew={msg.id === latestAssistantId}
                      onAsk={handleQuery}
                      onResume={() => void handleQuery('resume')}
                      onContact={() => void handleQuery('How can I contact Imani Gad?')}
                      voiceEnabled={voiceOut}
                    />
                  ),
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Sticky bottom input */}
            <div
              style={{
                position: 'fixed',
                bottom: 52,
                left: 0,
                right: isContextOpen ? 252 : 0,
                zIndex: 45,
                padding: '20px 24px 16px',
                background: 'linear-gradient(to top, rgba(9,9,11,1) 55%, rgba(9,9,11,0) 100%)',
                transition: 'right 0.38s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <div style={{ maxWidth: 740, margin: '0 auto' }}>
                <ChatInput
                  onSubmit={handleQuery}
                  onVoice={() => setIsVoiceMode(true)}
                  disabled={appState === 'thinking'}
                />
                <div style={{ marginTop: 10 }}>
                  <ConversationChips chips={convoChips} onSelect={handleQuery} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Context panel ── */}
      {isContextOpen && (
        <RecruiterSessionPanel session={session} onClose={() => setIsContextOpen(false)} />
      )}

      {overlay === 'fit' && (
        <FitPanel
          conversationId={conversationId}
          onClose={() => setOverlay(null)}
          onAsk={(query) => {
            setOverlay(null)
            void handleQuery(query)
          }}
        />
      )}
      {overlay === 'interview' && <InterviewPanel onClose={() => setOverlay(null)} />}
      {overlay === 'timeline' && (
        <CareerTimeline
          onClose={() => setOverlay(null)}
          onAsk={(query) => {
            setOverlay(null)
            void handleQuery(query)
          }}
        />
      )}

      <WorkInProgressFooter
        insetRight={isContextOpen ? 252 : 0}
        onResume={() => void handleQuery('resume')}
      />
    </div>
  )
}
