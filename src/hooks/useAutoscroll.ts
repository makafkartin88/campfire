import { useState, useEffect, useRef, useCallback } from 'react'

export function useAutoscroll() {
  const [active, setActive] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const rafRef = useRef<number>(0)

  const stop = useCallback(() => setActive(false), [])

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    const scroll = () => {
      window.scrollBy(0, speed * 0.5)
      // Auto-stop at bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
        setActive(false)
        return
      }
      rafRef.current = requestAnimationFrame(scroll)
    }
    rafRef.current = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(rafRef.current)
  }, [active, speed])

  // Stop on upward scroll
  useEffect(() => {
    if (!active) return
    let lastY = window.scrollY

    const handleScroll = () => {
      if (window.scrollY < lastY) stop()
      lastY = window.scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [active, stop])

  return { active, setActive, speed, setSpeed, stop }
}
