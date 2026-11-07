import type { NodeMetrics, Status } from '@shared/graph.ts'

export const fmtNum = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`

export const fmtMs = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`)

export const fmtPct = (v: number, digits = 0) => `${v.toFixed(digits)}%`

export const timeAgo = (ts: number) => {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  return `${Math.round(s / 60)}m ago`
}

export type MetricKey = keyof NodeMetrics

export const METRIC_THRESHOLDS: Record<MetricKey, [number, number] | null> = {
  cpu: [78, 92],
  memory: [85, 95],
  latencyMs: [300, 600],
  errorRate: [2, 5],
  rps: null,
}

export function metricStatus(key: MetricKey, value: number): Status {
  const t = METRIC_THRESHOLDS[key]
  if (!t) return 'active'
  if (value >= t[1]) return 'critical'
  if (value >= t[0]) return 'warning'
  return 'active'
}
