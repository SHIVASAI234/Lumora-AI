import { BookOpen, Circle, CircleCheck, ExternalLink, ScrollText, Waypoints, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createElement, useEffect, useMemo, useState } from 'react'
import { fmtMs } from '../lib/format.ts'
import { externalLink } from '../lib/links.ts'
import { generateLogs, generateRunbook, generateTraces } from '../lib/logs.ts'
import type { LogLevel } from '../lib/logs.ts'
import { STATUS_COLORS, TYPE_LABELS } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import type { LogTab } from '../store.ts'
import { useCodename, useNodeIcon } from './icons.ts'
import { RiskBadge } from './RiskMeter.tsx'
import { useNodeRisk } from './useNodeRisk.ts'

const TABS: { id: LogTab; label: string; icon: LucideIcon }[] = [
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'traces', label: 'Traces', icon: Waypoints },
  { id: 'runbook', label: 'Runbook', icon: BookOpen },
]

const LEVEL_COLORS: Record<LogLevel, string> = { INFO: '#94a3b8', WARN: STATUS_COLORS.warning, ERROR: STATUS_COLORS.critical }
const LEVELS: ('all' | LogLevel)[] = ['all', 'ERROR', 'WARN', 'INFO']
const clock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour12: false })
const durationColor = (ms: number) => (ms >= 600 ? STATUS_COLORS.critical : ms >= 300 ? STATUS_COLORS.warning : '#e6e9ff')

export function LogViewer() {
  const logs = useStore((s) => s.logs)
  const close = useStore((s) => s.closeLogs)
  const openLogs = useStore((s) => s.openLogs)
  const node = useStore((s) => (s.logs ? (s.graph?.nodes.find((nd) => nd.id === s.logs!.id) ?? null) : null))
  const history = useStore((s) => (s.logs ? s.history[s.logs.id] : undefined))
  const graph = useStore((s) => s.graph)
  const lastTickAt = useStore((s) => s.lastTickAt)
  const iconFor = useNodeIcon()
  const codename = useCodename(node)
  const risk = useNodeRisk(node)
  const [level, setLevel] = useState<'all' | LogLevel>('all')
  const [done, setDone] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!logs) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [logs, close])

  const lines = useMemo(() => (node ? generateLogs(node, history ?? [], graph, lastTickAt) : []), [node, history, graph, lastTickAt])
  const traces = useMemo(() => (node ? generateTraces(node, history ?? [], graph, lastTickAt) : []), [node, history, graph, lastTickAt])
  const runbook = useMemo(() => (node && risk ? generateRunbook(node, graph, risk.metric) : null), [node, graph, risk])

  if (!logs || !node) return null
  const Icon = iconFor(node)
  const href = externalLink(logs.tab, node)
  const filtered = level === 'all' ? lines : lines.filter((l) => l.level === level)

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={`${node.label} diagnostics`} className="glass toast-in flex h-[min(620px,85vh)] w-[min(840px,100%)] flex-col overflow-hidden rounded-2xl">
        <div className="flex items-start gap-3 px-5 pb-3 pt-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2" style={{ color: STATUS_COLORS[node.status] }}>
            {createElement(Icon, { size: 18 })}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">{node.label}</h2>
            {codename && <p className="truncate text-xs font-semibold text-fuchsia-300">{codename}</p>}
            <p className="truncate text-xs text-slate-400">
              {TYPE_LABELS[node.type]} · {node.owner} · {node.version} · {node.region}
            </p>
          </div>
          <RiskBadge node={node} />
          <button aria-label="Close diagnostics" onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-white/5 px-4 pb-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={logs.tab === t.id}
              onClick={() => openLogs(node.id, t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${logs.tab === t.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
          {href && (
            <a href={href} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
              Open externally <ExternalLink size={12} />
            </a>
          )}
        </div>

        {logs.tab === 'logs' && (
          <>
            <div className="flex items-center gap-1.5 px-5 py-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  aria-pressed={level === l}
                  className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${level === l ? 'border-white/20 bg-white/10 text-white' : 'border-white/5 text-slate-400 hover:text-slate-200'}`}
                >
                  <span style={{ color: l === 'all' ? undefined : LEVEL_COLORS[l] }}>{l === 'all' ? 'All' : l}</span>
                  <span className="tabular-nums text-slate-500">{l === 'all' ? lines.length : lines.filter((x) => x.level === l).length}</span>
                </button>
              ))}
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-mint">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" /> Live tail · simulated
              </span>
            </div>
            <ol className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-4 font-mono text-[12px] leading-relaxed">
              {filtered.map((l) => (
                <li key={l.key} className={`flex gap-3 rounded px-2 py-0.5 ${l.level === 'ERROR' ? 'bg-rose/10' : ''}`}>
                  <span className="shrink-0 text-slate-500">{clock(l.ts)}</span>
                  <span className="w-11 shrink-0 font-semibold" style={{ color: LEVEL_COLORS[l.level] }}>
                    {l.level}
                  </span>
                  <span className="hidden shrink-0 text-slate-600 sm:inline">{l.traceId}</span>
                  <span className="min-w-0 break-words text-slate-200">{l.msg}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        {logs.tab === 'traces' && (
          <ul className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-5 py-3">
            {traces.map((t) => (
              <li key={t.traceId} className="rounded-xl border border-white/5 bg-white/[.03] p-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.error ? STATUS_COLORS.critical : STATUS_COLORS.active }} />
                  <span className="truncate font-mono text-slate-200">{t.route}</span>
                  <span className="hidden font-mono text-[11px] text-slate-500 sm:inline">{t.traceId}</span>
                  <span className="ml-auto shrink-0 tabular-nums" style={{ color: durationColor(t.durationMs) }}>
                    {fmtMs(t.durationMs)}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {t.spans.map((sp, i) => (
                    <div key={`${sp.name}-${i}`} className="flex items-center gap-2 text-[11px]">
                      <span className={`w-32 shrink-0 truncate ${i ? 'pl-3 text-slate-400' : 'text-slate-200'}`}>{sp.name}</span>
                      <div className="relative h-2 flex-1 rounded bg-white/5">
                        <div
                          className="absolute inset-y-0 rounded"
                          style={{
                            left: `${(sp.offsetMs / t.durationMs) * 100}%`,
                            width: `${Math.max(1.5, (sp.durationMs / t.durationMs) * 100)}%`,
                            background: sp.error ? STATUS_COLORS.critical : i ? '#60a5fa' : '#a78bfa',
                          }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right tabular-nums text-slate-500">{fmtMs(sp.durationMs)}</span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}

        {logs.tab === 'runbook' && runbook && risk && (
          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-3">
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>
                On-call <span className="text-slate-200">{runbook.oncall}</span>
              </span>
              <span>
                Focus <span className="text-slate-200">{risk.reason}</span>
              </span>
            </div>
            <ol className="space-y-2">
              {runbook.steps.map((st, i) => {
                const key = `${node.id}:${i}`
                const checked = !!done[key]
                return (
                  <li key={key}>
                    <button
                      onClick={() => setDone({ ...done, [key]: !checked })}
                      aria-pressed={checked}
                      className="flex w-full gap-3 rounded-xl border border-white/5 bg-white/[.03] p-3 text-left hover:bg-white/[.06]"
                    >
                      {checked ? <CircleCheck size={16} className="mt-0.5 shrink-0 text-mint" /> : <Circle size={16} className="mt-0.5 shrink-0 text-slate-500" />}
                      <div>
                        <div className={`text-sm font-medium ${checked ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                          {i + 1}. {st.title}
                        </div>
                        <div className="text-xs text-slate-400">{st.detail}</div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>
            <p className="mt-3 text-xs text-slate-400">{runbook.escalation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
