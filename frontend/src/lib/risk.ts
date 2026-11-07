import type { GraphNode, GraphSnapshot, NodeMetrics } from '@shared/graph.ts'
import { METRIC_THRESHOLDS } from './format.ts'

export type RiskMetric = 'cpu' | 'memory' | 'latencyMs' | 'errorRate'
export type RiskLevel = 'low' | 'elevated' | 'high' | 'severe'

export interface Risk {
  score: number
  level: RiskLevel
  metric: RiskMetric
  pctOfLimit: number
  rising: boolean
  dependents: number
  reason: string
}

export const RISK_LEVELS: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: 'Low', color: '#34f5c5' },
  elevated: { label: 'Elevated', color: '#fde047' },
  high: { label: 'High', color: '#ffb547' },
  severe: { label: 'Severe', color: '#ff4d6d' },
}

const LABELS: Record<RiskMetric, string> = { cpu: 'CPU', memory: 'Memory', latencyMs: 'p95 latency', errorRate: 'Error rate' }

/** Maps a metric onto 0..1.25 where the warning threshold sits at 0.6 and the critical threshold at 1. */
function pressure(metric: RiskMetric, v: number) {
  const [warn, crit] = METRIC_THRESHOLDS[metric]!
  return v < warn ? (0.6 * v) / warn : Math.min(1.25, 0.6 + (0.4 * (v - warn)) / (crit - warn))
}

export const dependentsOf = (graph: GraphSnapshot, id: string) => graph.edges.filter((e) => e.target === id).length

/** 0-100 score: threshold proximity (≤75) + rising trend (10) + blast radius scaled by pressure (≤15). */
export function computeRisk(node: GraphNode, history: NodeMetrics[], dependents: number): Risk {
  const metrics: RiskMetric[] = node.type === 'external' ? ['latencyMs', 'errorRate'] : ['cpu', 'memory', 'latencyMs', 'errorRate']
  let metric = metrics[0]
  let p = -1
  for (const m of metrics) {
    const mp = pressure(m, node.metrics[m])
    if (mp > p) {
      p = mp
      metric = m
    }
  }
  const crit = METRIC_THRESHOLDS[metric]![1]
  const avg = (xs: NodeMetrics[]) => xs.reduce((a, h) => a + h[metric], 0) / xs.length
  const recent = history.slice(-3)
  const past = history.slice(-12, -9)
  const rising = recent.length > 0 && past.length > 0 && avg(recent) - avg(past) > crit * 0.05
  const capped = Math.min(1, p)
  const score = Math.round(Math.min(100, capped * 75 + (rising ? 10 : 0) + Math.min(15, dependents * 2.5) * capped))
  const level: RiskLevel = score >= 75 ? 'severe' : score >= 55 ? 'high' : score >= 35 ? 'elevated' : 'low'
  const pctOfLimit = Math.round((node.metrics[metric] / crit) * 100)
  const reason = `${LABELS[metric]} at ${pctOfLimit}% of limit${rising ? ', rising' : ''} · ${dependents} dependent${dependents === 1 ? '' : 's'}`
  return { score, level, metric, pctOfLimit, rising, dependents, reason }
}
