import { useEffect, useState } from "react"
import { THINKING_LABELS } from "../../data"
import { MonoLabel } from "../../components/ui"
import { Orb } from "./Orb"

export function ThinkingView({ lastQuery }: { lastQuery: string }) {
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
            color: "rgba(255,255,255,0.22)",
            fontStyle: "italic",
            letterSpacing: "-0.01em",
            maxWidth: 340,
            textAlign: "center",
            lineHeight: 1.55,
          }}
        >
          &ldquo;{lastQuery}&rdquo;
        </p>
      )}

      <div
        className="flex flex-col items-center gap-2"
        role="status"
        aria-live="polite"
      >
        <MonoLabel color="rgba(255,255,255,0.28)">THINKING</MonoLabel>
        <div
          key={key}
          className="animate-label"
          style={{ height: 16, display: "flex", alignItems: "center" }}
        >
          <MonoLabel color="rgba(110,168,255,0.60)">
            {THINKING_LABELS[idx]}
          </MonoLabel>
        </div>
      </div>
    </div>
  )
}
