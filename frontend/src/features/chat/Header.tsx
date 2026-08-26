import { HeaderChip, MonoLabel } from "../../components/ui"

export function ChatHeader({
  inConvo,
  isRecruiterMode,
  overlay,
  voiceOut,
  isContextOpen,
  onNew,
  onToggleRecruiter,
  onOverlay,
  onToggleVoice,
  onToggleSession,
}: {
  inConvo: boolean
  isRecruiterMode: boolean
  overlay: "fit" | "interview" | "timeline" | null
  voiceOut: boolean
  isContextOpen: boolean
  onNew: () => void
  onToggleRecruiter: () => void
  onOverlay: (value: "fit" | "interview" | "timeline" | null) => void
  onToggleVoice: () => void
  onToggleSession: () => void
}) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        background: inConvo ? "rgba(9,9,11,0.75)" : "transparent",
        borderBottom: inConvo ? "1px solid rgba(255,255,255,0.055)" : "none",
        backdropFilter: inConvo ? "blur(16px)" : "none",
        WebkitBackdropFilter: inConvo ? "blur(16px)" : "none",
        transition: "background 0.4s, border-color 0.4s, backdrop-filter 0.4s",
      }}
    >
      {/* Left: brand + new */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: inConvo ? 1 : 0.55,
          }}
        >
          <div
            className="animate-status-pulse"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(110,168,255,0.85)",
              boxShadow: "0 0 8px rgba(110,168,255,0.5)",
              flexShrink: 0,
            }}
          />
          <MonoLabel color="rgba(255,255,255,0.38)">IMANI GAD · AI</MonoLabel>
        </div>

        {inConvo && (
          <button
            onClick={onNew}
            aria-label="Start a new conversation"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.28)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.28)")
            }
          >
            ← NEW
          </button>
        )}
      </div>

      {/* Right: recruiter + context */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <HeaderChip
          active={isRecruiterMode}
          onClick={() => onToggleRecruiter()}
          label="Toggle recruiter mode"
        >
          RECRUITER
        </HeaderChip>
        <HeaderChip
          active={overlay === "fit"}
          onClick={() => onOverlay("fit")}
          label="Open fit analysis"
        >
          FIT
        </HeaderChip>
        <HeaderChip
          active={overlay === "interview"}
          onClick={() => onOverlay("interview")}
          label="Simulate an interview"
        >
          INTERVIEW
        </HeaderChip>
        <HeaderChip
          active={overlay === "timeline"}
          onClick={() => onOverlay("timeline")}
          label="Open career timeline"
        >
          TIMELINE
        </HeaderChip>
        <HeaderChip
          active={voiceOut}
          onClick={() => onToggleVoice()}
          label="Toggle spoken answers"
        >
          {voiceOut ? "VOICE" : "TEXT"}
        </HeaderChip>

        {inConvo && (
          <button
            onClick={() => onToggleSession()}
            aria-pressed={isContextOpen}
            aria-label="Toggle recruiter session panel"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: isContextOpen
                ? "rgba(110,168,255,0.88)"
                : "rgba(255,255,255,0.38)",
              background: isContextOpen
                ? "rgba(110,168,255,0.10)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                isContextOpen
                  ? "rgba(110,168,255,0.26)"
                  : "rgba(255,255,255,0.08)"
              }`,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            SESSION
          </button>
        )}
      </div>
    </header>
  )
}
