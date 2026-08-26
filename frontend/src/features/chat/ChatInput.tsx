import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { MonoLabel } from "../../components/ui"

export function ChatInput({
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
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 80)
  }, [autoFocus])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const submit = useCallback(() => {
    if (disabled || !value.trim()) return
    onSubmit(value.trim())
    setValue("")
  }, [value, onSubmit, disabled])

  const handleKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: focused
          ? "1px solid rgba(110,168,255,0.28)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: focused
          ? "0 0 0 3px rgba(110,168,255,0.07), 0 8px 40px rgba(0,0,0,0.35)"
          : "0 4px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        transition: "border-color 0.2s, box-shadow 0.2s",
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
          cursor: "pointer",
          background: "none",
          border: "none",
          padding: 0,
          color: "white",
          display: "flex",
          alignItems: "center",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.35")}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect
            x="4.5"
            y="1"
            width="6"
            height="8.5"
            rx="3"
            fill="currentColor"
            opacity="0.85"
          />
          <path
            d="M2.5 7.5c0 2.76 2.24 5 5 5s5-2.24 5-5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1="7.5"
            y1="12.5"
            x2="7.5"
            y2="14.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
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
          background: "none",
          border: "none",
          outline: "none",
          fontSize: 14.5,
          color: "rgba(255,255,255,0.86)",
          letterSpacing: "-0.012em",
          padding: "15px 10px",
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
              color: "rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 5,
              padding: "3px 6px",
              letterSpacing: "0.06em",
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
            background: "rgba(110,168,255,0.22)",
            border: "1px solid rgba(110,168,255,0.38)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s, opacity 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(110,168,255,0.34)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(110,168,255,0.22)")
          }
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M2 6.5h9M8 3l4 3.5-4 3.5"
              stroke="rgba(160,200,255,0.92)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Suggested chips ───────────────────────────────────────────────────────────

export function SuggestedChips({
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
            color: "rgba(255,255,255,0.46)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 999,
            padding: "7px 15px",
            cursor: "pointer",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: "border-color 0.18s, color 0.18s, background 0.18s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.7)"
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
            e.currentTarget.style.background = "rgba(255,255,255,0.055)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.46)"
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"
            e.currentTarget.style.background = "rgba(255,255,255,0.03)"
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

// ─── Thinking view ─────────────────────────────────────────────────────────────

export function Btn({
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
        letterSpacing: "0.14em",
        color: active ? "rgba(110,168,255,0.88)" : "rgba(255,255,255,0.46)",
        background: active
          ? "rgba(110,168,255,0.10)"
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${
          active ? "rgba(110,168,255,0.28)" : "rgba(255,255,255,0.09)"
        }`,
        borderRadius: 999,
        padding: "8px 18px",
        cursor: "pointer",
        transition: "all 0.18s",
      }}
    >
      {label}
    </button>
  )
}

// ─── Context panel ─────────────────────────────────────────────────────────────

export function ConversationChips({
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
            color: "rgba(255,255,255,0.36)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 999,
            padding: "5px 12px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.62)"
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.36)"
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
