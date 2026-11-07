import { useEffect, useState } from 'react'

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function useTypewriter(text: string, key: string, cps = 140) {
  const [progress, setProgress] = useState({ key, count: 0 })
  const count = reducedMotion() ? text.length : progress.key === key ? progress.count : 0

  useEffect(() => {
    if (reducedMotion()) return
    const start = performance.now()
    let raf = 0
    const tick = () => {
      const n = Math.min(text.length, Math.floor(((performance.now() - start) / 1000) * cps))
      setProgress({ key, count: n })
      if (n < text.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [key, text, cps])

  return { text: text.slice(0, count), done: count >= text.length }
}
