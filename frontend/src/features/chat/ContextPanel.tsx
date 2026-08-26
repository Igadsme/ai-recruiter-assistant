import { useEffect, useState } from "react"
import { fetchExperience, fetchProjects, fetchSkills } from "../../services/api"
import { MonoLabel } from "../../components/ui"

export function ContextPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState({
    experience: [] as string[],
    projects: [] as string[],
    skills: [] as string[],
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  useEffect(() => {
    void Promise.all([fetchExperience(), fetchProjects(), fetchSkills()])
      .then(([experience, projects, skills]) => {
        setItems({
          experience: experience.map((role) => role.organization),
          projects: projects.map((project) => project.title),
          skills: skills.slice(0, 12),
        })
      })
      .catch(() => undefined)
  }, [])

  return (
    <aside
      className="animate-slide-in-right fixed right-0 top-0 bottom-0 flex flex-col"
      aria-label="Candidate context"
      style={{
        width: 252,
        background: "rgba(11,11,14,0.94)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(36px) saturate(1.5)",
        WebkitBackdropFilter: "blur(36px) saturate(1.5)",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 sticky top-0"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(11,11,14,0.92)",
        }}
      >
        <MonoLabel color="rgba(255,255,255,0.36)">CONTEXT</MonoLabel>
        <button
          onClick={onClose}
          aria-label="Close context panel"
          style={{
            color: "rgba(255,255,255,0.28)",
            fontSize: 18,
            lineHeight: 1,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 2px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.28)")
          }
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 px-5 py-6">
        <CtxSection
          title="EXPERIENCE"
          items={items.experience}
          dot="rgba(110,168,255,0.7)"
        />
        <CtxSection
          title="PROJECTS"
          items={items.projects}
          dot="rgba(74,222,128,0.65)"
        />
        <CtxSection
          title="SKILLS"
          items={items.skills}
          dot="rgba(248,196,100,0.65)"
        />
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 mt-auto"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8.5,
            color: "rgba(255,255,255,0.18)",
            letterSpacing: "0.12em",
            lineHeight: 1.7,
            textTransform: "uppercase",
          }}
        >
          Responses grounded in
          <br />
          Imani Gad's verified data
        </p>
      </div>
    </aside>
  )
}

export function CtxSection({
  title,
  items,
  dot,
}: {
  title: string
  items: string[]
  dot: string
}) {
  return (
    <div>
      <MonoLabel color="rgba(255,255,255,0.24)">{title}</MonoLabel>
      <div className="flex flex-col gap-1.5" style={{ marginTop: 10 }}>
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: dot,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.48)",
                letterSpacing: "-0.01em",
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
