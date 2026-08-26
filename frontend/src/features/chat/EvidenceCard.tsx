import { useState } from "react"
import type { EvidenceItem } from "../../data"
import { MonoLabel, TechTag } from "../../components/ui"

export function MetricTag({ label }: { label: string }) {
  const pos = label.startsWith("+")
  const neg = label.startsWith("-")
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10.5,
        fontWeight: 500,
        color: pos
          ? "rgba(74,222,128,0.88)"
          : neg
            ? "rgba(110,168,255,0.88)"
            : "rgba(248,196,100,0.88)",
        background: pos
          ? "rgba(74,222,128,0.07)"
          : neg
            ? "rgba(110,168,255,0.07)"
            : "rgba(248,196,100,0.07)",
        border: `1px solid ${
          pos
            ? "rgba(74,222,128,0.18)"
            : neg
              ? "rgba(110,168,255,0.18)"
              : "rgba(248,196,100,0.18)"
        }`,
        borderRadius: 5,
        padding: "2px 8px",
        letterSpacing: "0.02em",
        lineHeight: 1.6,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  )
}

export function EvidenceCard({ item }: { item: EvidenceItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${
          open ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.07)"
        }`,
        background: open ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full text-left px-4 py-3 flex items-start gap-3 group"
        style={{ cursor: "pointer", background: "none", border: "none" }}
      >
        {/* Left accent bar */}
        <div
          style={{
            width: 2,
            minHeight: 16,
            alignSelf: "stretch",
            borderRadius: 1,
            background: open
              ? "rgba(110,168,255,0.5)"
              : "rgba(110,168,255,0.2)",
            flexShrink: 0,
            transition: "background 0.2s",
            marginTop: 2,
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: "rgba(255,255,255,0.78)",
                letterSpacing: "-0.01em",
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
              {item.metrics
                ?.slice(0, 2)
                .map((m) => <MetricTag key={m} label={m} />)}
            </div>
          )}
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.22)",
            fontSize: 9,
            marginTop: 3,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.22s ease",
            flexShrink: 0,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em",
          }}
        >
          {open ? "HIDE" : "MORE"}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 12,
            }}
          />
          <MonoLabel color="rgba(255,255,255,0.28)">{item.period}</MonoLabel>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.60)",
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
            {item.metrics?.map((m) => <MetricTag key={m} label={m} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Assistant message ─────────────────────────────────────────────────────────
