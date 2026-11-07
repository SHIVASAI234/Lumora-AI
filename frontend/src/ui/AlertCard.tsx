import { Activity, ArrowRight, ChevronRight, ScrollText } from 'lucide-react'
import { createElement } from 'react'
import type { GraphNode, Status, TriggerMetric } from '@shared/graph.ts'
import { fmtMs, fmtPct, timeAgo } from '../lib/format.ts'
import { STATUS_COLORS, STATUS_LABELS, TYPE_LABELS } from '../lib/themes.ts'
import type { FeedEvent } from '../store.ts'
import { useCodename, useNodeIcon } from './icons.ts'
import { RiskBadge } from './RiskMeter.tsx'

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

interface Props {
  event: FeedEvent
  node?: GraphNode
  cluster?: string
  unread: boolean
  onInspect: () => void
  onLogs: () => void
}

export function AlertCard({ event: e, node, cluster, unread, onInspect, onLogs }: Props) {
  const iconFor = useNodeIcon()
  const codename = useCodename(node)
  const Icon = node ? iconFor(node) : Activity
  const color = STATUS_COLORS[e.to]
  const label = node?.label ?? e.id

  return (
    <li className="rounded-xl border border-white/5 border-l-[3px] bg-white/[.03] transition-colors hover:bg-white/[.07]" style={{ borderLeftColor: color }}>
      <button onClick={onInspect} aria-label={`Inspect ${label}: ${e.from} to ${e.to}`} className="w-full px-3 pb-1.5 pt-2.5 text-left">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg p-1.5" style={{ color, background: `${color}1f`, boxShadow: `0 0 12px ${color}33` }}>
            {createElement(Icon, { size: 15 })}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-white">{label}</span>
              {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" aria-label="unread" />}
              <span className="ml-auto shrink-0 text-[11px] text-slate-400">{timeAgo(e.at)}</span>
            </div>
            {node && (
              <div className="truncate text-[11px] text-slate-400">
                {TYPE_LABELS[node.type]} · {cluster ?? node.cluster}
                {codename && <span className="text-fuchsia-300"> · {codename}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <StatusBadge status={e.from} />
          <ArrowRight size={12} className="shrink-0 text-slate-400" />
          <StatusBadge status={e.to} />
        </div>
        <div className="mt-1.5 truncate text-xs text-slate-100">{detail(e)}</div>
      </button>
      <div className="flex items-center gap-1 px-3 pb-2.5">
        {node && <RiskBadge node={node} />}
        <button onClick={onLogs} className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-white/10 hover:text-white">
          <ScrollText size={12} /> Logs
        </button>
        <button onClick={onInspect} className="flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white">
          {e.metric ? `View ${METRIC_LABELS[e.metric]}` : 'Inspect'}
          <ChevronRight size={12} />
        </button>
      </div>
    </li>
  )
}
