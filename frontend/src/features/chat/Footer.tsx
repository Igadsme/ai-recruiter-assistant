import React, { useEffect, useRef, useState } from "react"
import { fetchBrief } from "../../services/api"

export function WorkInProgressFooter({
  insetRight,
  onResume,
}: {
  insetRight: number
  onResume: () => void
}) {
  const [contactOpen, setContactOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)
  const [contact, setContact] = useState({ email: "", phone: "", linkedin: "" })

  useEffect(() => {
    void fetchBrief()
      .then((brief) =>
        setContact({
          email: brief.email,
          phone: brief.phone,
          linkedin: brief.linkedin,
        }),
      )
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!contactOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContactOpen(false)
    }
    const onPointer = (event: MouseEvent) => {
      if (
        contactRef.current &&
        !contactRef.current.contains(event.target as Node)
      ) {
        setContactOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("mousedown", onPointer)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("mousedown", onPointer)
    }
  }, [contactOpen])

  const linkStyle: React.CSSProperties = {
    color: "rgba(150,180,255,0.92)",
    textDecoration: "none",
    wordBreak: "break-all",
  }

  return (
    <footer
      ref={contactRef}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: insetRight,
        zIndex: 50,
        padding: "8px 20px 10px",
        background: "rgba(9,9,11,0.92)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        transition: "right 0.38s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {contactOpen && (
        <div
          role="dialog"
          aria-label="Imani Gad's contact information"
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(360px, calc(100% - 32px))",
            padding: "14px 16px 16px",
            background: "rgba(14,14,18,0.98)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.42)",
            }}
          >
            CONTACT
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ContactRow label="Email">
              <a href={`mailto:${contact.email}`} style={linkStyle}>
                {contact.email}
              </a>
            </ContactRow>
            <ContactRow label="Phone number">
              <a
                href={`tel:${contact.phone.replace(/-/g, "")}`}
                style={linkStyle}
              >
                {contact.phone}
              </a>
            </ContactRow>
            <ContactRow label="LinkedIn">
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
              >
                {contact.linkedin}
              </a>
            </ContactRow>
          </div>
        </div>
      )}
      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontSize: 11.5,
          lineHeight: 1.45,
          fontWeight: 380,
          color: "rgba(255,255,255,0.38)",
          letterSpacing: "-0.01em",
          maxWidth: 720,
          marginInline: "auto",
        }}
      >
        Work in Progress: I'm still learning the ropes! If I ever get confused
        or hallucinate details, check out Imani's{" "}
        <button
          type="button"
          onClick={() => {
            setContactOpen(false)
            onResume()
          }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "rgba(150,180,255,0.85)",
            textDecoration: "underline",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          official resume
        </button>{" "}
        above or{" "}
        <button
          type="button"
          onClick={() => setContactOpen((open) => !open)}
          aria-expanded={contactOpen}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "rgba(150,180,255,0.85)",
            textDecoration: "underline",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          reach out to him directly
        </button>
        .
      </p>
    </footer>
  )
}

function ContactRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.40)",
          fontWeight: 450,
        }}
      >
        {label}:
      </span>
      <span
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.82)",
          lineHeight: 1.35,
        }}
      >
        {children}
      </span>
    </div>
  )
}
