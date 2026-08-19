import type { ProjectDeepDive } from '../services/api'
import { MonoLabel } from './ui'

export function ArchitectureDiagram({
  architecture,
}: {
  architecture: ProjectDeepDive['architecture']
}) {
  const rows = Math.max(...architecture.nodes.map((node) => node.row), 0)
  const cols = Math.max(...architecture.nodes.map((node) => node.column), 0) + 1

  return (
    <div className="animate-fade-in" style={{ marginTop: 14 }}>
      {Array.from({ length: rows + 1 }, (_, row) => (
        <div key={row}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap: 10,
              alignItems: 'stretch',
            }}
          >
            {Array.from({ length: cols }, (_, column) => {
              const node = architecture.nodes.find((item) => item.row === row && item.column === column)
              if (!node) return <div key={column} />
              return (
                <div
                  key={node.id}
                  style={{
                    borderRadius: 10,
                    border: '1px solid rgba(110,168,255,0.28)',
                    background: 'rgba(12,18,40,0.65)',
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{node.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{node.detail}</div>
                </div>
              )
            })}
          </div>
          {row < rows && (
            <div style={{ textAlign: 'center', color: 'rgba(110,168,255,0.45)', fontSize: 12, padding: '6px 0' }}>
              ↓
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <MonoLabel color="rgba(255,255,255,0.22)">VERIFIED SYSTEM DIAGRAM</MonoLabel>
      </div>
    </div>
  )
}
