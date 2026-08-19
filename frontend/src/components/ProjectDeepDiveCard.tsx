import { useState } from 'react'
import type { ProjectDeepDive } from '../services/api'
import { trackEvent } from '../services/api'
import { ArchitectureDiagram } from './ArchitectureDiagram'
import { MonoLabel, TechTag } from './ui'

export function ProjectDeepDiveCard({
  project,
  onGithub,
}: {
  project: ProjectDeepDive
  onGithub?: () => void
}) {
  const [showArch, setShowArch] = useState(false)

  return (
    <div
      className="animate-scale-in"
      style={{
        marginTop: 18,
        borderRadius: 14,
        border: '1px solid rgba(110,168,255,0.16)',
        background: 'rgba(110,168,255,0.04)',
        padding: 16,
      }}
    >
      <MonoLabel>PROJECT DEEP DIVE</MonoLabel>
      <h3 style={{ fontSize: 18, fontWeight: 450, margin: '8px 0 2px', letterSpacing: '-0.03em' }}>
        {project.title}
      </h3>
      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>{project.subtitle}</p>

      <Section title="Problem" body={project.problem} />
      <Section title="Solution" body={project.solution} />

      <div style={{ marginBottom: 12 }}>
        <MonoLabel color="rgba(255,255,255,0.3)">ARCHITECTURE</MonoLabel>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', margin: '6px 0 8px' }}>
          {project.architectureSummary}
        </p>
        <button
          type="button"
          onClick={() => setShowArch((value) => !value)}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'rgba(110,168,255,0.85)',
            background: 'none',
            border: '1px solid rgba(110,168,255,0.25)',
            borderRadius: 8,
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          {showArch ? 'HIDE ARCHITECTURE' : 'VIEW ARCHITECTURE'}
        </button>
        {showArch && <ArchitectureDiagram architecture={project.architecture} />}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {project.technologies.map((tech) => (
          <TechTag key={tech} label={tech} />
        ))}
      </div>

      <List title="What Imani contributed" items={project.contributed} />
      <List title="Engineering challenges" items={project.challenges} />
      <List title="Impact" items={project.impact} />

      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            onGithub?.()
            void trackEvent('github_clicked', { query: project.title })
          }}
          style={{
            display: 'inline-block',
            marginTop: 4,
            fontSize: 13,
            color: 'rgba(150,180,255,0.9)',
          }}
        >
          GitHub →
        </a>
      )}
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <MonoLabel color="rgba(255,255,255,0.3)">{title.toUpperCase()}</MonoLabel>
      <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginTop: 6 }}>{body}</p>
    </div>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <MonoLabel color="rgba(255,255,255,0.3)">{title.toUpperCase()}</MonoLabel>
      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
        {items.map((item) => (
          <li key={item} style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 1.55, marginBottom: 4 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
