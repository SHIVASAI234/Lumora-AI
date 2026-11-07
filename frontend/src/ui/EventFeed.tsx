import { useStore } from '../store.ts'
import { STATUS_COLORS } from '../lib/themes.ts'
import { useNow } from './useNow.ts'

const VISIBLE_MS = 8000

export function EventFeed() {
  const events = useStore((s) => s.events)
  const graph = useStore((s) => s.graph)
  const select = useStore((s) => s.select)
  const now = useNow(1000)
  const recent = events.filter((e) => now - e.at < VISIBLE_MS).slice(0, 3)
  if (!recent.length) return null
  const labels = new Map(graph?.nodes.map((nd) => [nd.id, nd.label]))
  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
      {recent.map((e) => (
        <button
          key={e.key}
          onClick={() => select(e.id)}
          className="glass toast-in pointer-events-auto flex items-center gap-2 rounded-full px-4 py-1.5 text-xs hover:bg-white/10"
        >
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[e.to], boxShadow: `0 0 10px ${STATUS_COLORS[e.to]}` }} />
          <span className="font-semibold text-white">{labels.get(e.id) ?? e.id}</span>
          <span style={{ color: STATUS_COLORS[e.from] }}>{e.from}</span>
          <span className="text-slate-500">→</span>
          <span style={{ color: STATUS_COLORS[e.to] }}>{e.to}</span>
          <span className="hidden text-slate-500 sm:inline">· {e.reason}</span>
        </button>
      ))}
    </div>
  )
}
