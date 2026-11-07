import { Activity, ArrowRight, ChevronRight } from 'lucide-react'
import type { Status, TriggerMetric } from '@shared/graph.ts'
import { fmtMs, fmtPct, timeAgo } from '../lib/format.ts'
import { STATUS_COLORS, STATUS_LABELS, TYPE_LABELS } from '../lib/themes.ts'
import type { FeedEvent } from '../store.ts'
import { useStore } from '../store.ts'
import { TYPE_ICONS } from './icons.ts'
import { useNow } from './useNow.ts'

const VISIBLE_MS = 10000

const METRIC_LABELS: Record<TriggerMetric, string> = {
  cpu: 'CPU',
  latencyMs: 'p95 latency',
  errorRate: 'Error rate',
}

const fmtMetric = (metric: TriggerMetric, v: number) => (metric === 'latencyMs' ? fmtMs(v) : fmtPct(v, metric === 'errorRate' ? 1 : 0))

function detail(e: FeedEvent) {
  if (e.to === 'active') return 'Recovered: all metrics within thresholds'
  if (e.metric && e.value !== undefined && e.threshold !== undefined) {
    return `${METRIC_LABELS[e.metric]} ${fmtMetric(e.metric, e.value)} (${e.to} ≥ ${e.metric === 'latencyMs' ? fmtMs(e.threshold) : `${e.threshold}%`})`
  }
  return e.reason
}

function StatusBadge({ status }: { status: Status }) {
  const color = STATUS_COLORS[status]
  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color, background: `${color}1f` }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function EventFeed() {
  const events = useStore((s) => s.events)
  const graph = useStore((s) => s.graph)
  const inspectEvent = useStore((s) => s.inspectEvent)
  const now = useNow(1000)
  const recent = events.filter((e) => now - e.at < VISIBLE_MS).slice(0, 3)
  if (!recent.length || !graph) return null
  const nodes = new Map(graph.nodes.map((nd) => [nd.id, nd]))
  const clusters = new Map(graph.clusters.map((c) => [c.id, c.label]))

  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-30 flex w-[min(380px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2" aria-live="polite">
      {recent.map((e) => {
        const node = nodes.get(e.id)
        const Icon = node ? TYPE_ICONS[node.type] : Activity
        const color = STATUS_COLORS[e.to]
        const label = node?.label ?? e.id
        return (
          <button
            key={e.key}
            onClick={() => inspectEvent(e)}
            aria-label={`Inspect ${label}: ${e.from} to ${e.to}`}
            className="glass toast-in group pointer-events-auto w-full rounded-xl border-l-[3px] px-3 py-2.5 text-left transition-colors hover:bg-white/10"
            style={{ borderLeftColor: color }}
          >
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg p-1.5" style={{ color, background: `${color}1f`, boxShadow: `0 0 12px ${color}33` }}>
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-semibold text-white">{label}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-slate-400">{timeAgo(e.at)}</span>
                </div>
                {node && (
                  <div className="truncate text-[11px] text-slate-400">
                    {TYPE_LABELS[node.type]} · {clusters.get(node.cluster) ?? node.cluster}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <StatusBadge status={e.from} />
              <ArrowRight size={12} className="shrink-0 text-slate-400" />
              <StatusBadge status={e.to} />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-100">{detail(e)}</span>
              <span className="flex shrink-0 items-center text-[11px] font-medium text-slate-400 transition-colors group-hover:text-white">
                {e.metric ? `View ${METRIC_LABELS[e.metric]}` : 'Inspect'}
                <ChevronRight size={12} />
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
