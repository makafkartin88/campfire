import { useState, useEffect, useRef, useCallback } from 'react'

function getScroller(): HTMLElement | Window {
  return (
    (document.querySelector('[data-scroll-container]') as HTMLElement | null) ??
    window
  )
}

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

    const scroller = getScroller()
    const isWindow = scroller === window

    const scroll = () => {
      if (isWindow) {
        window.scrollBy(0, speed * 0.5)
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
          setActive(false)
          return
        }
      } else {
        const el = scroller as HTMLElement
        el.scrollBy(0, speed * 0.5)
        if (el.clientHeight + el.scrollTop >= el.scrollHeight - 10) {
          setActive(false)
          return
        }
      }
      rafRef.current = requestAnimationFrame(scroll)
    }
    rafRef.current = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(rafRef.current)
  }, [active, speed])

  // Stop on upward scroll
  useEffect(() => {
    if (!active) return
    const scroller = getScroller()
    const isWindow = scroller === window
    let lastY = isWindow ? window.scrollY : (scroller as HTMLElement).scrollTop

    const handleScroll = () => {
      const currentY = isWindow ? window.scrollY : (scroller as HTMLElement).scrollTop
      // Allow small auto-scroll increments; only stop on a real upward jump
      if (currentY < lastY - 2) stop()
      lastY = currentY
    }

    const target: EventTarget = isWindow ? window : (scroller as HTMLElement)
    target.addEventListener('scroll', handleScroll, { passive: true })
    return () => target.removeEventListener('scroll', handleScroll)
  }, [active, stop])

  return { active, setActive, speed, setSpeed, stop }
}
