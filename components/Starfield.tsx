'use client'

import { useEffect, useRef } from 'react'

export function Starfield() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrameId: number
        let stars: { x: number; y: number; size: number; speed: number }[] = []
        let mouseX = 0
        let mouseY = 0

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initStars()
        }

        const initStars = () => {
            stars = []
            const numStars = Math.floor((canvas.width * canvas.height) / 4000)
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.5,
                    speed: Math.random() * 0.5 + 0.1,
                })
            }
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(9, 9, 11, 0.2)' // Trail effect
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            stars.forEach((star) => {
                // Move star
                star.y += star.speed
                if (star.y > canvas.height) {
                    star.y = 0
                    star.x = Math.random() * canvas.width
                }

                // Dither/Distort based on mouse
                const dx = star.x - mouseX
                const dy = star.y - mouseY
                const dist = Math.sqrt(dx * dx + dy * dy)
                const maxDist = 200

                let drawX = star.x
                let drawY = star.y
                let drawSize = star.size

                if (dist < maxDist) {
                    const force = (maxDist - dist) / maxDist
                    drawX += (Math.random() - 0.5) * 10 * force // Jitter
                    drawY += (Math.random() - 0.5) * 10 * force
                    drawSize += Math.random() * 2 * force
                }

                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
                ctx.beginPath()
                ctx.arc(drawX, drawY, drawSize, 0, Math.PI * 2)
                ctx.fill()
            })

            animationFrameId = requestAnimationFrame(draw)
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY
        }

        window.addEventListener('resize', resize)
        window.addEventListener('mousemove', handleMouseMove)

        resize()
        draw()

        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', handleMouseMove)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-60"
        />
    )
}
