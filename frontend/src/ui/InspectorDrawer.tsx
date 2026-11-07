import { Activity, ArrowLeft, ArrowRight, Cpu, Gauge, LoaderCircle, MemoryStick, RefreshCw, Sparkles, Timer, TriangleAlert, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { GraphNode, Insight } from '@shared/graph.ts'
import { fmtMs, fmtNum, fmtPct, metricStatus } from '../lib/format.ts'
import type { MetricKey } from '../lib/format.ts'
import { requestInsight } from '../lib/live.ts'
import { STATUS_COLORS, STATUS_LABELS, THEMES, TYPE_LABELS } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import { TYPE_ICONS } from './icons.ts'
import { Sparkline } from './Sparkline.tsx'
import { useTypewriter } from './useTypewriter.ts'

const METRICS: { key: MetricKey; label: string; icon: LucideIcon; fmt: (v: number) => string; wide?: boolean }[] = [
  { key: 'cpu', label: 'CPU', icon: Cpu, fmt: (v) => fmtPct(v) },
  { key: 'memory', label: 'Memory', icon: MemoryStick, fmt: (v) => fmtPct(v) },
  { key: 'latencyMs', label: 'p95 latency', icon: Timer, fmt: fmtMs },
  { key: 'rps', label: 'Throughput', icon: Gauge, fmt: (v) => `${fmtNum(v)}/s` },
  { key: 'errorRate', label: 'Error rate', icon: TriangleAlert, fmt: (v) => fmtPct(v, 1), wide: true },
]

function MetricCard({ node, metric }: { node: GraphNode; metric: (typeof METRICS)[number] }) {
  const history = useStore((s) => s.history[node.id]) ?? []
  const value = node.metrics[metric.key]
  const status = metricStatus(metric.key, value)
  const color = metric.key === 'rps' ? '#a5b4fc' : STATUS_COLORS[status]
  const Icon = metric.icon
  const disabled = node.type === 'external' && (metric.key === 'cpu' || metric.key === 'memory')
  return (
    <div className={`rounded-xl border border-white/5 bg-white/[.03] p-3 ${metric.wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Icon size={12} /> {metric.label}
        </span>
        {status !== 'active' && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums" style={{ color: disabled ? undefined : status === 'active' ? '#e6e9ff' : color }}>
        {disabled ? <span className="text-sm text-slate-500">n/a (SaaS)</span> : metric.fmt(value)}
      </div>
      {!disabled && <Sparkline values={history.map((h) => h[metric.key])} color={color} />}
    </div>
  )
}

function ConnectionList({ node }: { node: GraphNode }) {
  const graph = useStore((s) => s.graph)
  const select = useStore((s) => s.select)
  if (!graph) return null
  const byId = new Map(graph.nodes.map((nd) => [nd.id, nd]))
  const inbound = graph.edges.filter((e) => e.target === node.id)
  const outbound = graph.edges.filter((e) => e.source === node.id)
  const rows = [
    ...inbound.map((e) => ({ edge: e, other: byId.get(e.source)!, dir: 'in' as const })),
    ...outbound.map((e) => ({ edge: e, other: byId.get(e.target)!, dir: 'out' as const })),
  ]
  return (
    <section className="border-t border-white/5 px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="micro-label">Connections ({rows.length})</h3>
        <span className="text-[11px] text-slate-500">
          in {inbound.length} · out {outbound.length}
        </span>
      </div>
      <ul className="space-y-1">
        {rows.map(({ edge, other, dir }) => {
          const Icon = TYPE_ICONS[other.type]
          return (
            <li key={edge.id}>
              <button
                onClick={() => select(other.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5"
              >
                {dir === 'in' ? <ArrowLeft size={13} className="text-slate-500" /> : <ArrowRight size={13} className="text-slate-500" />}
                <Icon size={13} className="text-slate-400" />
                <span className="flex-1 truncate">{other.label}</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">{edge.kind}</span>
                <span className="w-14 text-right text-xs tabular-nums text-slate-400">{fmtNum(edge.throughput)}/s</span>
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[other.status] }} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const SEVERITY_COLORS = { info: '#34f5c5', warning: '#ffb547', critical: '#ff4d6d' }

function InsightResult({ insight }: { insight: Insight }) {
  const { text, done } = useTypewriter(insight.summary, insight.id)
  const color = SEVERITY_COLORS[insight.severity]
  return (
    <div className="toast-in space-y-3">
      <div className="text-sm font-semibold" style={{ color }}>
        {insight.headline}
      </div>
      <p className="text-[13px] leading-relaxed text-slate-300">
        {text}
        {!done && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-slate-300 align-middle" />}
      </p>
      {done && (
        <div className="toast-in space-y-3">
          {insight.findings.length > 0 && (
            <div>
              <div className="micro-label mb-1.5">Findings</div>
              <ul className="space-y-1 text-[12.5px] text-slate-300">
                {insight.findings.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <div className="micro-label mb-1.5">Recommendations</div>
            <ul className="space-y-1 text-[12.5px] text-slate-300">
              {insight.recommendations.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-mint">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>confidence {insight.confidence.toFixed(2)}</span>
            <span className="font-mono">{insight.model}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function InsightPanel({ node }: { node: GraphNode }) {
  const insight = useStore((s) => s.insights[node.id])
  const loading = useStore((s) => !!s.insightLoading[node.id])
  const error = useStore((s) => s.insightError[node.id])
  const theme = THEMES[useStore((s) => s.theme)]

  return (
    <section className="border-t border-white/5 px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="micro-label flex items-center gap-1.5">
          <Sparkles size={12} style={{ color: theme.accent }} /> AI Diagnostics
        </h3>
        <button
          onClick={() => void requestInsight(node.id)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${theme.edgeFrom}, ${theme.edgeTo})`, boxShadow: `0 0 16px ${theme.accent}55` }}
        >
          {loading ? <LoaderCircle size={13} className="animate-spin" /> : insight ? <RefreshCw size={13} /> : <Sparkles size={13} />}
          {loading ? 'Analysing' : insight ? 'Re-analyse' : 'Analyse'}
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Analysing telemetry, dependencies and blast radius…</p>
          <div className="shimmer h-4 w-3/4 rounded" />
          <div className="shimmer h-3 w-full rounded" />
          <div className="shimmer h-3 w-5/6 rounded" />
          <div className="shimmer h-3 w-2/3 rounded" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose/30 bg-rose/10 p-3 text-xs text-rose">
          {error}{' '}
          <button className="underline" onClick={() => void requestInsight(node.id)}>
            Retry
          </button>
        </div>
      ) : insight ? (
        <InsightResult insight={insight} />
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-400">
          Run AI diagnostics to explain this node's health, trace root causes through its dependencies and get remediation steps.
        </p>
      )}
    </section>
  )
}

export function InspectorDrawer() {
  const graph = useStore((s) => s.graph)
  const selectedId = useStore((s) => s.selectedId)
  const select = useStore((s) => s.select)
  const current = graph?.nodes.find((nd) => nd.id === selectedId) ?? null
  const [last, setLast] = useState<GraphNode | null>(null)
  if (current && current !== last) setLast(current)
  const node = current ?? last
  const open = !!current
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [selectedId])

  return (
    <aside
      aria-hidden={!open}
      className={`glass pointer-events-auto fixed bottom-4 right-4 top-24 z-20 flex w-[400px] flex-col overflow-hidden rounded-2xl transition-transform duration-300 ease-out-expo max-sm:left-2 max-sm:right-2 max-sm:top-auto max-sm:h-[70vh] max-sm:w-auto ${
        open ? 'translate-x-0 translate-y-0' : 'translate-x-[calc(100%+2rem)] max-sm:translate-x-0 max-sm:translate-y-[calc(100%+2rem)]'
      }`}
    >
      {node && (
        <>
          <div className="relative px-5 pb-4 pt-5">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30"
              style={{ background: `radial-gradient(ellipse at 20% 0%, ${STATUS_COLORS[node.status]}, transparent 70%)` }}
            />
            <div className="relative flex items-start gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5" style={{ color: STATUS_COLORS[node.status] }}>
                {(() => {
                  const Icon = TYPE_ICONS[node.type]
                  return <Icon size={20} />
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">{node.label}</h2>
                <p className="truncate text-xs text-slate-400">
                  {TYPE_LABELS[node.type]} · {node.cluster} · {node.version} · {node.region}
                </p>
              </div>
              <button aria-label="Close inspector" onClick={() => select(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="relative mt-3 flex flex-wrap items-center gap-2">
              <span
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[.14em]"
                style={{ color: STATUS_COLORS[node.status], borderColor: `${STATUS_COLORS[node.status]}55`, background: `${STATUS_COLORS[node.status]}15` }}
              >
                <Activity size={11} /> {STATUS_LABELS[node.status].toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-500">{node.owner}</span>
              {node.tags.map((t) => (
                <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  #{t}
                </span>
              ))}
            </div>
            <p className="relative mt-3 text-[13px] leading-relaxed text-slate-300">{node.description}</p>
          </div>
          <div ref={scroller} className="scrollbar-thin flex-1 overflow-y-auto">
            <section className="border-t border-white/5 px-5 py-4">
              <h3 className="micro-label mb-3">Live metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                {METRICS.map((m) => (
                  <MetricCard key={m.key} node={node} metric={m} />
                ))}
              </div>
            </section>
            <InsightPanel node={node} />
            <ConnectionList node={node} />
          </div>
        </>
      )}
    </aside>
  )
}
