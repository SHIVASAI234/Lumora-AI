import { DEFAULT_TICK_MS, mulberry32 } from '@shared/graph.ts'
import type { GraphNode, GraphSnapshot, NodeMetrics, NodeType } from '@shared/graph.ts'
import type { RiskMetric } from './risk.ts'

export type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export interface LogLine {
  key: string
  ts: number
  level: LogLevel
  msg: string
  traceId: string
}

export interface Span {
  name: string
  offsetMs: number
  durationMs: number
  error: boolean
}

export interface Trace {
  traceId: string
  ts: number
  route: string
  durationMs: number
  error: boolean
  spans: Span[]
}

export interface RunbookStep {
  title: string
  detail: string
}

const ROUTES: Record<NodeType, string[]> = {
  gateway: ['GET /v1/catalog', 'POST /v1/checkout', 'GET /v1/session', 'POST /v1/auth/token'],
  service: ['GET /internal/items', 'POST /internal/process', 'GET /internal/status', 'PUT /internal/update'],
  database: ['SELECT orders', 'UPDATE inventory', 'INSERT ledger_entries', 'SELECT users'],
  queue: ['consume order.created', 'publish payment.settled', 'consume refund.requested', 'ack batch'],
  cache: ['GET session:*', 'SET cart:*', 'GET price:*', 'DEL stale:*'],
  ai: ['POST /v1/embed', 'POST /v1/score', 'POST /v1/generate', 'GET /v1/model'],
  external: ['POST /v1/charges', 'POST /v1/messages', 'GET /v1/status', 'POST /v1/verify'],
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 2166136261)
const sampleSeed = (id: string, m: NodeMetrics) => hash(`${id}:${m.rps.toFixed(1)}:${m.latencyMs.toFixed(1)}:${m.errorRate.toFixed(2)}`)
const newTraceId = (rand: () => number) => Math.floor(rand() * 0xffffffff).toString(16).padStart(8, '0')
const pick = <T,>(xs: T[], rand: () => number) => xs[Math.floor(rand() * xs.length)]
const errorChance = (m: NodeMetrics) => Math.min(0.6, (m.errorRate / 100) * 3)

function downstream(graph: GraphSnapshot | null, id: string) {
  if (!graph) return []
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  return graph.edges.flatMap((edge) => {
    const node = edge.source === id ? byId.get(edge.target) : undefined
    return node ? [{ edge, node }] : []
  })
}

/** Simulated log lines derived from the node's metric history (one sample per telemetry tick), newest first. */
export function generateLogs(node: GraphNode, history: NodeMetrics[], graph: GraphSnapshot | null, now: number): LogLine[] {
  const deps = downstream(graph, node.id).map((d) => d.node.label)
  const samples = history.length ? history : [node.metrics]
  const lines: LogLine[] = []
  samples.forEach((m, i) => {
    const rand = mulberry32(sampleSeed(node.id, m))
    const base = now - (samples.length - 1 - i) * DEFAULT_TICK_MS
    const count = 2 + Math.floor(rand() * 2)
    for (let j = 0; j < count; j++) {
      const ts = base - Math.floor(rand() * DEFAULT_TICK_MS)
      const route = pick(ROUTES[node.type], rand)
      const dep = deps.length ? pick(deps, rand) : 'upstream'
      const traceId = newTraceId(rand)
      const r = rand()
      let level: LogLevel = 'INFO'
      let msg = `${route} → 200 in ${Math.round(m.latencyMs * (0.5 + rand() * 0.7))}ms`
      if (r < errorChance(m)) {
        level = 'ERROR'
        msg =
          rand() < 0.5
            ? `${route} → 500: ${dep} timed out after ${Math.round(m.latencyMs * 1.6)}ms`
            : `${route} → 503: ${dep} connection refused (retry ${1 + Math.floor(rand() * 3)}/3)`
      } else if (m.latencyMs >= 300 && r < 0.55) {
        level = 'WARN'
        msg = `slow request ${route} took ${Math.round(m.latencyMs * (0.9 + rand() * 0.4))}ms (p95 budget 300ms)`
      } else if (m.cpu >= 78 && r < 0.7) {
        level = 'WARN'
        msg = `CPU at ${m.cpu.toFixed(0)}%: worker pool saturated, queueing requests`
      } else if (m.memory >= 85 && r < 0.75) {
        level = 'WARN'
        msg = `heap usage ${m.memory.toFixed(0)}%: GC pause ${Math.round(40 + rand() * 120)}ms`
      }
      lines.push({ key: `${traceId}-${j}`, ts, level, msg, traceId })
    }
  })
  return lines.sort((a, b) => b.ts - a.ts)
}

/** One simulated trace per recent tick: a root span for the node plus spans for its downstream calls. */
export function generateTraces(node: GraphNode, history: NodeMetrics[], graph: GraphSnapshot | null, now: number): Trace[] {
  const deps = downstream(graph, node.id).slice(0, 4)
  const samples = (history.length ? history : [node.metrics]).slice(-10)
  return samples
    .map((m, i) => {
      const rand = mulberry32(sampleSeed(node.id, m) ^ 0x9e3779b9)
      const route = pick(ROUTES[node.type], rand)
      const selfMs = Math.max(2, m.latencyMs * (0.15 + rand() * 0.25))
      let offset = selfMs * 0.4
      const children: Span[] = deps.map(({ edge, node: dn }) => {
        const span = { name: dn.label, offsetMs: offset, durationMs: Math.max(1, edge.latencyMs * (0.6 + rand() * 0.8)), error: dn.status === 'critical' && rand() < 0.5 }
        offset += span.durationMs * (0.3 + rand() * 0.5)
        return span
      })
      const durationMs = Math.max(offset + selfMs * 0.6, ...children.map((s) => s.offsetMs + s.durationMs))
      const error = rand() < errorChance(m) || children.some((s) => s.error)
      return {
        traceId: newTraceId(rand),
        ts: now - (samples.length - 1 - i) * DEFAULT_TICK_MS,
        route,
        durationMs,
        error,
        spans: [{ name: node.label, offsetMs: 0, durationMs, error }, ...children],
      }
    })
    .reverse()
}

export function generateRunbook(node: GraphNode, graph: GraphSnapshot | null, metric: RiskMetric) {
  const deps = downstream(graph, node.id)
  const slowest = [...deps].sort((a, b) => b.edge.latencyMs - a.edge.latencyMs)[0]
  const dependents = graph?.edges.filter((e) => e.target === node.id).length ?? 0
  const byMetric: Record<RiskMetric, RunbookStep[]> = {
    errorRate: [
      { title: 'Check the latest deploy', detail: `Compare the error spike with the rollout of ${node.version}; roll back if errors started after the release.` },
      { title: 'Find the failing route', detail: 'Filter the Logs tab to ERROR and look for the route and dependency that fail most often.' },
    ],
    latencyMs: [
      {
        title: 'Locate the slow span',
        detail: slowest
          ? `Open the Traces tab; the slowest dependency right now is ${slowest.node.label} (${Math.round(slowest.edge.latencyMs)}ms).`
          : 'Open the Traces tab and look for the widest span.',
      },
      { title: 'Add capacity', detail: 'Scale out replicas or raise the connection-pool size, then watch p95 for a few ticks.' },
    ],
    cpu: [
      { title: 'Scale horizontally', detail: 'Increase replicas (HPA target 70% CPU) to take load off saturated workers.' },
      { title: 'Profile hot paths', detail: 'Capture a CPU profile and look for regressions introduced in the latest build.' },
    ],
    memory: [
      { title: 'Check for leaks', detail: 'Compare heap usage across replicas; restart the worst offender and capture a heap snapshot.' },
      { title: 'Tune limits', detail: 'Raise the memory limit or shrink in-process caches if GC pauses keep growing.' },
    ],
  }
  const byType: Record<NodeType, RunbookStep> = {
    gateway: { title: 'Protect upstreams', detail: 'Enable rate limiting or load shedding on the hottest routes.' },
    service: {
      title: 'Verify dependencies',
      detail: deps.length ? `Check the health of ${deps.slice(0, 3).map((d) => d.node.label).join(', ')}.` : 'Check the health of downstream calls.',
    },
    database: { title: 'Inspect the database', detail: 'Review the slow-query log, lock waits and active connection count.' },
    queue: { title: 'Check consumer lag', detail: 'Add consumers or pause producers if the backlog keeps growing.' },
    cache: { title: 'Check hit ratio', detail: 'Look for eviction storms or a cold cache after a restart; pre-warm hot keys.' },
    ai: { title: 'Check model serving', detail: 'Verify GPU utilisation and batch size; fall back to the previous model version if needed.' },
    external: { title: 'Check the provider', detail: 'Open the provider status page and switch on the circuit breaker / fallback path.' },
  }
  return {
    oncall: `@${node.owner}-oncall`,
    steps: [...byMetric[metric], byType[node.type], { title: 'Confirm recovery', detail: 'Wait for the node to return to Active in the notifications feed, then close the incident.' }],
    escalation: dependents
      ? `Escalate to the owners of ${dependents} dependent service${dependents === 1 ? '' : 's'} if not resolved within 15 minutes.`
      : 'Escalate to the platform team if not resolved within 15 minutes.',
  }
}
