import { MonoLabel } from "../../components/ui"
import { Orb } from "./Orb"
import { Btn } from "./ChatInput"

export function VoiceView({
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
    ? "Voice is not supported in this browser"
    : muted
      ? "Muted"
      : listening
        ? "Listening…"
        : "Microphone paused"

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
            color: "rgba(255,255,255,0.72)",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          {status}
        </p>
        {transcript && (
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.38)",
              maxWidth: 360,
              textAlign: "center",
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
          label={muted ? "UNMUTE" : "MUTE"}
        />
        <Btn onClick={onStop} label="STOP" />
      </div>
    </div>
  )
}
