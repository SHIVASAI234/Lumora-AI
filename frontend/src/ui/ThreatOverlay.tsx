import type { CSSProperties } from 'react'
import { useStore } from '../store.ts'

export function ThreatOverlay() {
  const enabled = useStore((s) => s.threatFx)
  const critical = useStore((s) => s.graph?.nodes.filter((nd) => nd.status === 'critical').length ?? 0)
  if (!enabled || critical === 0) return null
  return (
    <div
      aria-hidden="true"
      className="threat-vignette pointer-events-none fixed inset-0 z-[5]"
      style={{ '--threat': Math.min(1, 0.3 + critical * 0.08) } as CSSProperties}
    />
  )
}
