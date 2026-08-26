import { useEffect, useState } from "react"
import { MonoLabel } from "../../components/ui"
import { fetchProfile, trackEvent } from "../../services/api"

export function ResumeCard() {
  const [previewing, setPreviewing] = useState(false)
  const [identity, setIdentity] = useState({ name: "", line: "" })

  useEffect(() => {
    void fetchProfile()
      .then(({ profile, education }) => {
        setIdentity({
          name: profile.name,
          line: `${education.degree} · ${education.school} · ${education.expectedGraduation}`.toUpperCase(),
        })
      })
      .catch(() => undefined)
  }, [])

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid rgba(110,168,255,0.22)",
        background: "rgba(110,168,255,0.05)",
        overflow: "hidden",
        marginTop: 20,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
        }}
      >
        {/* PDF icon */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: "rgba(110,168,255,0.12)",
            border: "1px solid rgba(110,168,255,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
            <path
              d="M10.5 1H3C2.17 1 1.5 1.67 1.5 2.5v15C1.5 18.33 2.17 19 3 19h12c.83 0 1.5-.67 1.5-1.5V7L10.5 1z"
              stroke="rgba(110,168,255,0.7)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M10.5 1v6h6"
              stroke="rgba(110,168,255,0.5)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="5"
              y1="13"
              x2="13"
              y2="13"
              stroke="rgba(110,168,255,0.45)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <line
              x1="5"
              y1="10"
              x2="13"
              y2="10"
              stroke="rgba(110,168,255,0.45)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "rgba(255,255,255,0.82)",
              letterSpacing: "-0.01em",
              marginBottom: 3,
            }}
          >
            {identity.name || "Resume"}
          </p>
          <MonoLabel color="rgba(255,255,255,0.32)">
            {identity.line || "VERIFIED CANDIDATE FILE"}
          </MonoLabel>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => {
              setPreviewing((p) => !p)
              if (!previewing) void trackEvent("resume_viewed")
            }}
            aria-expanded={previewing}
            aria-label={previewing ? "Close resume preview" : "Preview resume"}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              letterSpacing: "0.12em",
              color: previewing
                ? "rgba(110,168,255,0.88)"
                : "rgba(255,255,255,0.42)",
              background: previewing
                ? "rgba(110,168,255,0.10)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                previewing ? "rgba(110,168,255,0.28)" : "rgba(255,255,255,0.10)"
              }`,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            {previewing ? "CLOSE" : "PREVIEW"}
          </button>

          <a
            href="/IMANI_GAD.pdf"
            download="Imani_Gad_Resume.pdf"
            onClick={() => void trackEvent("resume_downloaded")}
            aria-label="Download Imani Gad resume PDF"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              letterSpacing: "0.12em",
              color: "rgba(110,168,255,0.90)",
              background: "rgba(110,168,255,0.13)",
              border: "1px solid rgba(110,168,255,0.30)",
              borderRadius: 8,
              padding: "6px 14px",
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(110,168,255,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(110,168,255,0.13)")
            }
          >
            DOWNLOAD
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M5 1v6M2 5l3 3 3-3"
                stroke="rgba(110,168,255,0.9)"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* PDF preview */}
      {previewing && (
        <div
          className="animate-fade-in"
          style={{ borderTop: "1px solid rgba(110,168,255,0.14)" }}
        >
          <iframe
            src="/IMANI_GAD.pdf"
            width="100%"
            height="680"
            title="Imani Gad Resume"
            style={{ display: "block", border: "none" }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Evidence card ─────────────────────────────────────────────────────────────
