import React from 'react'

export function MonoLabel({
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

export function TechTag({ label }: { label: string }) {
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

export function HeaderChip({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(active)}
      aria-label={label}
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        color: active ? 'rgba(110,168,255,0.90)' : 'rgba(255,255,255,0.38)',
        background: active ? 'rgba(110,168,255,0.10)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(110,168,255,0.28)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 999,
        padding: '6px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}
