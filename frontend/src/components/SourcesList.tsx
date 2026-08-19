import { useState } from 'react'
import type { Source } from '../services/api'
import { fetchSource } from '../services/api'
import { MonoLabel, TechTag } from './ui'

export function SourcesList({
  sources,
  onOpenProject,
}: {
  sources: Source[]
  onOpenProject?: (id: string) => void
}) {
  if (sources.length === 0) return null
  return (
    <div className="animate-fade-in" style={{ marginTop: 18 }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
        <MonoLabel color="rgba(255,255,255,0.28)">SOURCES</MonoLabel>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sources.map((source) => (
          <SourceRow key={source.id ?? source.title} source={source} onOpenProject={onOpenProject} />
        ))}
      </div>
    </div>
  )
}

function SourceRow({
  source,
  onOpenProject,
}: {
  source: Source
  onOpenProject?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Source | null>(null)
  const label = `${source.category ?? source.type} → ${source.organization && source.type === 'experience' ? source.organization : source.title}`

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && source.id && !detail) {
      try {
        setDetail(await fetchSource(source.id))
      } catch {
        setDetail(source)
      }
    }
    if (next && source.id?.startsWith('project:') && onOpenProject) {
      onOpenProject(source.id.replace('project:', ''))
    }
  }

  const shown = detail ?? source

  return (
    <div
      style={{
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.07)',
        background: open ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <button
        type="button"
        onClick={() => void toggle()}
        aria-expanded={open}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          padding: '10px 12px',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        {label}
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          {shown.date && (
            <MonoLabel color="rgba(255,255,255,0.28)">{shown.date}</MonoLabel>
          )}
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.6, marginTop: 8 }}>
            {shown.relevantExcerpt}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {(shown.technologies ?? []).map((tech) => (
              <TechTag key={tech} label={tech} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
