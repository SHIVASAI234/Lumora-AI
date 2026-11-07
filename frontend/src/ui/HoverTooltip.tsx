import { useEffect, useState } from 'react'
import { fmtMs } from '../lib/format.ts'
import { STATUS_COLORS, STATUS_LABELS, TYPE_LABELS } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import { useCodename } from './icons.ts'

export function HoverTooltip() {
  const node = useStore((s) => (s.hoveredId && s.hoveredId !== s.selectedId ? s.graph?.nodes.find((nd) => nd.id === s.hoveredId) : null))
  const codename = useCodename(node)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  if (!node) return null
  return (
    <div className="glass pointer-events-none fixed z-40 rounded-lg px-3 py-2 text-xs" style={{ left: pos.x + 16, top: pos.y + 16 }}>
      <div className="font-semibold text-white">{node.label}</div>
      {codename && <div className="text-[11px] font-semibold text-fuchsia-300">{codename}</div>}
      <div className="mt-0.5 flex items-center gap-2 text-slate-400">
        <span>{TYPE_LABELS[node.type]}</span>
        <span className="flex items-center gap-1" style={{ color: STATUS_COLORS[node.status] }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[node.status] }} />
          {STATUS_LABELS[node.status]}
        </span>
        <span>p95 {fmtMs(node.metrics.latencyMs)}</span>
      </div>
    </div>
  )
}
