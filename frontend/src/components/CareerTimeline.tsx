import { useEffect, useState } from 'react'
import { fetchTimeline, type TimelineNode } from '../services/api'
import { Overlay } from './FitPanel'
import { MonoLabel } from './ui'

export function CareerTimeline({
  onClose,
  onAsk,
}: {
  onClose: () => void
  onAsk: (query: string) => void
}) {
  const [nodes, setNodes] = useState<TimelineNode[]>([])

  useEffect(() => {
    void fetchTimeline().then(setNodes).catch(() => undefined)
  }, [])

  return (
    <Overlay title="CAREER TIMELINE" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {nodes.map((node, index) => (
          <button
            key={node.id}
            type="button"
            onClick={() => onAsk(`${node.title} at ${node.organization}`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '72px 16px 1fr',
              gap: 12,
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <MonoLabel color="rgba(110,168,255,0.7)">{node.year}</MonoLabel>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(110,168,255,0.8)',
                  marginTop: 4,
                }}
              />
              {index < nodes.length - 1 && (
                <div style={{ width: 1, flex: 1, minHeight: 28, background: 'rgba(110,168,255,0.2)' }} />
              )}
            </div>
            <div style={{ paddingBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.84)' }}>{node.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{node.organization}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}>
                {node.detail}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Overlay>
  )
}
