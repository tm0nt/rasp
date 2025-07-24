"use client"

import { useEffect, useRef } from "react"

interface ConfettiProps {
  isActive: boolean
}

interface Particle {
  x: number
  y: number
  size: number
  rotation: number
  speedX: number
  speedY: number
  opacity: number
  color: string
  shape: "square" | "circle"
}

/**
 * A performant, canvas-based confetti animation component.
 *
 * Features:
 * - Realistic physics simulation (gravity, rotation, fade-out).
 * - Renders hundreds of particles smoothly using a single canvas.
 * - Customizable particle properties (colors, shapes, sizes).
 * - Animation is only active when needed to save resources.
 */
export function Confetti({ isActive }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number>()
  const particles = useRef<Particle[]>([])

  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]

  // Creates a single confetti particle with random properties
  const createParticle = (width: number): Particle => ({
    x: Math.random() * width,
    y: -20 - Math.random() * 50, // Start above the screen
    size: 5 + Math.random() * 10,
    rotation: Math.random() * 360,
    speedX: Math.random() * 10 - 5,
    speedY: 5 + Math.random() * 5, // Initial downward speed
    opacity: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: Math.random() > 0.5 ? "square" : "circle",
  })

  // The main animation loop
  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Update and draw each particle
    particles.current.forEach((p, index) => {
      // Apply gravity
      p.speedY += 0.1
      p.x += p.speedX
      p.y += p.speedY

      // Fade out over time
      p.opacity -= 0.005

      // Update rotation
      p.rotation += p.speedX / 2

      // If particle is off-screen or faded, replace it
      if (p.y > canvas.height || p.opacity <= 0) {
        particles.current[index] = createParticle(canvas.width)
      }

      // Draw the particle
      ctx.save()
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)

      if (p.shape === "square") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    })

    animationFrameId.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Resize canvas to fill the screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    if (isActive) {
      // Initialize particles
      const particleCount = 200
      particles.current = Array.from({ length: particleCount }, () => createParticle(canvas.width))
      // Start animation
      animate()
    } else {
      // Stop animation and clear canvas
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      const ctx = canvas.getContext("2d")
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [isActive])

  if (!isActive) return null

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-50" aria-hidden="true" />
}
