import { useEffect, useRef, useState } from "react"
import type { OrbState } from "./types"

export function useOrbSize() {
  const [size, setSize] = useState(200)
  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? 148 : 200)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  return size
}

// ─── Canvas Orb ───────────────────────────────────────────────────────────────

export function Orb({ orbState }: { orbState: OrbState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const orbStateRef = useRef<OrbState>(orbState)
  const animRef = useRef<number>(0)
  const size = useOrbSize()

  useEffect(() => {
    orbStateRef.current = orbState
  }, [orbState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r = size * 0.344

    let t = 0
    let ring1 = 0
    let ring2 = Math.PI * 0.22

    const ring = (rx: number, angle: number, alpha: number) => {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      ctx.beginPath()
      ctx.ellipse(0, 0, rx, rx * 0.21, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(112,168,255,${alpha})`
      ctx.lineWidth = 0.75
      ctx.stroke()
      ctx.restore()
    }

    const draw = () => {
      const st = orbStateRef.current
      ctx.clearRect(0, 0, size, size)

      const breathSpd = st === "voice" ? 4.2 : st === "thinking" ? 2.5 : 0.88
      const breathAmp =
        st === "voice" ? 0.058 : st === "thinking" ? 0.04 : 0.017
      const scale = 1 + Math.sin(t * breathSpd) * breathAmp

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(scale, scale)
      ctx.translate(-cx, -cy)

      // Outer ambient glow
      const ga =
        st === "thinking"
          ? 0.085 + Math.sin(t * 2.5) * 0.042
          : st === "voice"
            ? 0.1 + Math.sin(t * 4.2) * 0.052
            : 0.042
      const gOut = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r * 2.55)
      gOut.addColorStop(0, `rgba(86,134,255,${ga})`)
      gOut.addColorStop(0.45, `rgba(86,134,255,${ga * 0.28})`)
      gOut.addColorStop(1, "rgba(86,134,255,0)")
      ctx.fillStyle = gOut
      ctx.beginPath()
      ctx.arc(cx, cy, r * 2.55, 0, Math.PI * 2)
      ctx.fill()

      // Sphere base gradient
      const gBase = ctx.createRadialGradient(
        cx - r * 0.31,
        cy - r * 0.3,
        r * 0.01,
        cx,
        cy,
        r,
      )
      gBase.addColorStop(0, "rgba(168,202,255,0.13)")
      gBase.addColorStop(0.28, "rgba(112,158,255,0.09)")
      gBase.addColorStop(0.58, "rgba(72,108,232,0.06)")
      gBase.addColorStop(0.8, "rgba(46,70,195,0.04)")
      gBase.addColorStop(1, "rgba(22,40,135,0.025)")
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gBase
      ctx.fill()

      // Rim border
      ctx.strokeStyle = "rgba(145,192,255,0.13)"
      ctx.lineWidth = 1
      ctx.stroke()

      // Specular highlight (top-left)
      const gSpec = ctx.createRadialGradient(
        cx - r * 0.335,
        cy - r * 0.295,
        0,
        cx - r * 0.335,
        cy - r * 0.295,
        r * 0.55,
      )
      gSpec.addColorStop(0, "rgba(255,255,255,0.20)")
      gSpec.addColorStop(0.4, "rgba(218,235,255,0.05)")
      gSpec.addColorStop(1, "rgba(255,255,255,0)")
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gSpec
      ctx.fill()

      // Secondary micro-highlight (smaller, tighter)
      const gSpec2 = ctx.createRadialGradient(
        cx - r * 0.18,
        cy - r * 0.38,
        0,
        cx - r * 0.18,
        cy - r * 0.38,
        r * 0.16,
      )
      gSpec2.addColorStop(0, "rgba(255,255,255,0.10)")
      gSpec2.addColorStop(1, "rgba(255,255,255,0)")
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gSpec2
      ctx.fill()

      // Rim light bottom-right
      const gRim = ctx.createRadialGradient(
        cx + r * 0.62,
        cy + r * 0.58,
        r * 0.1,
        cx + r * 0.62,
        cy + r * 0.58,
        r * 0.84,
      )
      gRim.addColorStop(0, "rgba(100,165,255,0.09)")
      gRim.addColorStop(1, "rgba(100,165,255,0)")
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gRim
      ctx.fill()

      // Depth shadow bottom-right interior
      const gDep = ctx.createRadialGradient(
        cx + r * 0.38,
        cy + r * 0.34,
        0,
        cx + r * 0.38,
        cy + r * 0.34,
        r * 0.58,
      )
      gDep.addColorStop(0, "rgba(0,5,28,0.22)")
      gDep.addColorStop(1, "rgba(0,5,28,0)")
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = gDep
      ctx.fill()

      // Inner core glow (pulsing)
      const ci =
        st === "thinking"
          ? 0.128 + Math.sin(t * 2.5) * 0.056
          : st === "voice"
            ? 0.115 + Math.sin(t * 4.2) * 0.062
            : 0.056 + Math.sin(t * 0.88) * 0.018
      const gCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.64)
      gCore.addColorStop(0, `rgba(138,180,255,${ci})`)
      gCore.addColorStop(0.6, `rgba(138,180,255,${ci * 0.4})`)
      gCore.addColorStop(1, "rgba(138,180,255,0)")
      ctx.beginPath()
      ctx.arc(cx, cy, r * 0.64, 0, Math.PI * 2)
      ctx.fillStyle = gCore
      ctx.fill()

      ctx.restore()

      // Orbital rings (outside breathing transform)
      const ra1 = st === "thinking" ? 0.095 + Math.sin(t * 1.65) * 0.042 : 0.068
      const ra2 = st === "thinking" ? 0.06 + Math.sin(t * 1.95) * 0.03 : 0.038
      ring(r * 1.295, ring1, ra1)
      ring(r * 1.46, ring2 + Math.PI * 0.26, ra2)

      // Floating orbital particles
      for (let i = 0; i < 6; i++) {
        const pAng = (i / 6) * Math.PI * 2 + t * 0.3 + i * 0.58
        const pDist = r * (1.62 + i * 0.11)
        const px = cx + Math.cos(pAng) * pDist
        const py = cy + Math.sin(pAng) * pDist * 0.36
        const base = 0.26 + Math.sin(t * 0.88 + i * 1.18) * 0.13
        const mul = st === "thinking" ? 1.7 : st === "voice" ? 1.4 : 0.75
        ctx.beginPath()
        ctx.arc(px, py, 1.25, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(115,172,255,${Math.min(base * mul, 0.78)})`
        ctx.fill()
      }

      t += 0.016
      ring1 += 0.004
      ring2 -= 0.0026

      if (
        typeof window !== "undefined" &&
        !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
      ) {
        animRef.current = requestAnimationFrame(draw)
      }
    }

    draw()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", imageRendering: "crisp-edges" }}
    />
  )
}

// ─── Tags ─────────────────────────────────────────────────────────────────────
