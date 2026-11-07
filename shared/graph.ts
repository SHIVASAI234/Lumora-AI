export type NodeType = 'gateway' | 'service' | 'database' | 'queue' | 'cache' | 'ai' | 'external'
export type Status = 'active' | 'warning' | 'critical'
export type EdgeKind = 'http' | 'grpc' | 'event' | 'query'
export type InsightSeverity = 'info' | 'warning' | 'critical'
export type Vec3 = [number, number, number]

export const NODE_TYPES: NodeType[] = ['gateway', 'service', 'database', 'queue', 'cache', 'ai', 'external']
export const STATUSES: Status[] = ['active', 'warning', 'critical']

export interface NodeMetrics {
  cpu: number
  memory: number
  latencyMs: number
  rps: number
  errorRate: number
}

export interface GraphNode {
  id: string
  label: string
  type: NodeType
  status: Status
  cluster: string
  description: string
  owner: string
  version: string
  region: string
  tags: string[]
  metrics: NodeMetrics
  position: Vec3
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  kind: EdgeKind
  throughput: number
  latencyMs: number
  status: Status
}

export interface Cluster {
  id: string
  label: string
  color: string
  center: Vec3
}

export interface GraphSnapshot {
  version: string
  generatedAt: string
  seed: number
  clusters: Cluster[]
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface NodeTelemetry {
  id: string
  status: Status
  metrics: NodeMetrics
}

export interface EdgeTelemetry {
  id: string
  throughput: number
  latencyMs: number
  status: Status
}

export interface TelemetryTick {
  seq: number
  nodes: NodeTelemetry[]
  edges: EdgeTelemetry[]
}

export type TriggerMetric = 'cpu' | 'latencyMs' | 'errorRate'

export interface StatusChange {
  id: string
  from: Status
  to: Status
  reason: string
  /** Metric whose threshold set the new status; omitted when recovering to `active`. */
  metric?: TriggerMetric
  value?: number
  threshold?: number
}

export interface Insight {
  id: string
  nodeId: string
  severity: InsightSeverity
  headline: string
  summary: string
  findings: string[]
  recommendations: string[]
  confidence: number
  model: string
  generatedAt: string
}

export type ServerEvent =
  | { type: 'hello'; ts: string; payload: { serverVersion: string; tickMs: number } }
  | { type: 'telemetry.tick'; ts: string; payload: TelemetryTick }
  | { type: 'node.status_changed'; ts: string; payload: StatusChange }
  | { type: 'graph.resynced'; ts: string; payload: GraphSnapshot }
  | { type: 'insight.generated'; ts: string; payload: Insight }
  | { type: 'pong'; ts: string; payload: Record<string, never> }

export type ClientEvent = { type: 'ping'; ts: string; payload: Record<string, never> }

export const API_VERSION = '1.0'
export const DEFAULT_TICK_MS = 1500
export const DEFAULT_SEED = 1337

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface NodeSpec {
  id: string
  label: string
  type: NodeType
  description: string
  tags: string[]
}

interface ClusterSpec {
  id: string
  label: string
  color: string
  owner: string
  region: string
  nodes: NodeSpec[]
}

const n = (id: string, label: string, type: NodeType, description: string, tags: string[] = []): NodeSpec => ({
  id,
  label,
  type,
  description,
  tags,
})

const CATALOG: ClusterSpec[] = [
  {
    id: 'edge',
    label: 'Edge & Gateway',
    color: '#38bdf8',
    owner: 'team-platform',
    region: 'global',
    nodes: [
      n('cdn-edge', 'CDN Edge', 'external', 'Global CDN terminating TLS and caching static assets.', ['tls', 'cdn']),
      n('api-gateway', 'API Gateway', 'gateway', 'Single ingress for all public APIs; routing, auth hand-off and quotas.', ['ingress', 'envoy']),
      n('rate-limiter', 'Rate Limiter', 'service', 'Token-bucket rate limiting per API key and IP.', ['redis', 'quota']),
      n('web-bff', 'Web BFF', 'service', 'Backend-for-frontend aggregating APIs for the web app.', ['graphql']),
      n('mobile-bff', 'Mobile BFF', 'service', 'Backend-for-frontend tuned for mobile payload sizes.', ['graphql', 'mobile']),
      n('auth-proxy', 'Auth Proxy', 'gateway', 'Validates JWTs and injects identity headers.', ['jwt']),
    ],
  },
  {
    id: 'identity',
    label: 'Identity',
    color: '#a78bfa',
    owner: 'team-identity',
    region: 'eu-west-1',
    nodes: [
      n('identity-api', 'Identity API', 'service', 'User profiles, sign-up and login flows.', ['auth']),
      n('mfa-service', 'MFA Service', 'service', 'TOTP / WebAuthn second-factor verification.', ['security']),
      n('session-cache', 'Session Cache', 'cache', 'Redis cluster holding active sessions.', ['redis']),
      n('users-db', 'Users DB', 'database', 'PostgreSQL primary for user accounts.', ['postgres', 'pii']),
      n('oauth-provider', 'OAuth Provider', 'external', 'Third-party social login (Google, GitHub, Apple).', ['oidc']),
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    color: '#34d399',
    owner: 'team-commerce',
    region: 'eu-west-1',
    nodes: [
      n('catalog-api', 'Catalog API', 'service', 'Product catalogue reads and merchandising rules.', ['read-heavy']),
      n('search-service', 'Search Service', 'service', 'Full-text and faceted product search.', ['opensearch']),
      n('cart-service', 'Cart Service', 'service', 'Shopping cart state and promotions.', ['stateful']),
      n('checkout-api', 'Checkout API', 'service', 'Orchestrates checkout: cart → pricing → payment → order.', ['saga', 'critical-path']),
      n('pricing-engine', 'Pricing Engine', 'service', 'Real-time pricing, discounts and tax calculation.', ['cpu-bound']),
      n('inventory-service', 'Inventory Service', 'service', 'Stock levels and reservations per warehouse.', ['consistency']),
      n('catalog-db', 'Catalog DB', 'database', 'Document store for product data.', ['mongodb']),
      n('cart-cache', 'Cart Cache', 'cache', 'Low-latency cart snapshots.', ['redis']),
      n('orders-db', 'Orders DB', 'database', 'PostgreSQL cluster for orders and fulfilment.', ['postgres']),
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    color: '#f472b6',
    owner: 'team-payments',
    region: 'eu-west-1',
    nodes: [
      n('payments-api', 'Payments API', 'service', 'Authorises and captures payments across providers.', ['pci', 'critical-path']),
      n('fraud-scorer', 'Fraud Scorer', 'ai', 'Gradient-boosted model scoring transactions for fraud risk.', ['ml', 'realtime']),
      n('ledger-service', 'Ledger Service', 'service', 'Double-entry ledger for all money movement.', ['consistency']),
      n('ledger-queue', 'Ledger Queue', 'queue', 'Kafka topic buffering ledger postings.', ['kafka']),
      n('payments-db', 'Payments DB', 'database', 'Primary ledger and payment intent store.', ['postgres', 'pci']),
      n('refunds-worker', 'Refunds Worker', 'service', 'Async refund processing and reconciliation.', ['batch']),
      n('stripe-gateway', 'Stripe Gateway', 'external', 'External card processor.', ['psp']),
    ],
  },
  {
    id: 'data',
    label: 'Data Platform',
    color: '#fbbf24',
    owner: 'team-data',
    region: 'us-east-1',
    nodes: [
      n('event-bus', 'Event Bus', 'queue', 'Company-wide Kafka event backbone.', ['kafka']),
      n('stream-processor', 'Stream Processor', 'service', 'Flink jobs enriching and routing events.', ['flink']),
      n('etl-worker', 'ETL Worker', 'service', 'Batch ELT jobs into the warehouse.', ['airflow']),
      n('analytics-warehouse', 'Analytics Warehouse', 'database', 'Columnar warehouse for BI and ML features.', ['olap']),
      n('metrics-store', 'Metrics Store', 'database', 'Time-series DB for operational telemetry.', ['tsdb']),
      n('log-pipeline', 'Log Pipeline', 'queue', 'Log shipping and indexing pipeline.', ['observability']),
    ],
  },
  {
    id: 'ai',
    label: 'AI Platform',
    color: '#22d3ee',
    owner: 'team-ml',
    region: 'us-east-1',
    nodes: [
      n('llm-gateway', 'LLM Gateway', 'ai', 'Routes prompts to hosted LLMs with caching and guardrails.', ['llm', 'guardrails']),
      n('insight-agent', 'Insight Agent', 'ai', 'Agent generating operational insights from telemetry.', ['agent']),
      n('recommender', 'Recommender', 'ai', 'Personalised product recommendations.', ['ml', 'realtime']),
      n('embedding-worker', 'Embedding Worker', 'ai', 'Generates vector embeddings for catalogue and docs.', ['gpu']),
      n('vector-db', 'Vector DB', 'database', 'ANN index for semantic search and RAG.', ['vectors']),
      n('feature-store', 'Feature Store', 'cache', 'Online feature serving for models.', ['redis']),
      n('model-registry', 'Model Registry', 'service', 'Versioned model artefacts and rollout state.', ['mlops']),
    ],
  },
  {
    id: 'messaging',
    label: 'Messaging',
    color: '#fb923c',
    owner: 'team-engagement',
    region: 'eu-central-1',
    nodes: [
      n('notification-service', 'Notification Service', 'service', 'Fan-out of user notifications across channels.', ['fanout']),
      n('push-queue', 'Push Queue', 'queue', 'SQS queue for mobile push delivery.', ['sqs']),
      n('email-provider', 'Email Provider', 'external', 'Transactional email delivery.', ['smtp']),
      n('sms-provider', 'SMS Provider', 'external', 'SMS / OTP delivery.', ['otp']),
    ],
  },
]

const LINKS: [string, string, EdgeKind][] = [
  ['cdn-edge', 'api-gateway', 'http'],
  ['api-gateway', 'rate-limiter', 'grpc'],
  ['api-gateway', 'auth-proxy', 'grpc'],
  ['api-gateway', 'web-bff', 'http'],
  ['api-gateway', 'mobile-bff', 'http'],
  ['auth-proxy', 'identity-api', 'grpc'],
  ['auth-proxy', 'session-cache', 'query'],
  ['identity-api', 'users-db', 'query'],
  ['identity-api', 'mfa-service', 'grpc'],
  ['identity-api', 'oauth-provider', 'http'],
  ['identity-api', 'session-cache', 'query'],
  ['mfa-service', 'sms-provider', 'http'],
  ['web-bff', 'catalog-api', 'grpc'],
  ['web-bff', 'cart-service', 'grpc'],
  ['web-bff', 'checkout-api', 'grpc'],
  ['web-bff', 'recommender', 'grpc'],
  ['web-bff', 'search-service', 'grpc'],
  ['mobile-bff', 'catalog-api', 'grpc'],
  ['mobile-bff', 'cart-service', 'grpc'],
  ['mobile-bff', 'checkout-api', 'grpc'],
  ['catalog-api', 'catalog-db', 'query'],
  ['catalog-api', 'pricing-engine', 'grpc'],
  ['search-service', 'catalog-db', 'query'],
  ['search-service', 'vector-db', 'query'],
  ['cart-service', 'cart-cache', 'query'],
  ['cart-service', 'pricing-engine', 'grpc'],
  ['cart-service', 'inventory-service', 'grpc'],
  ['checkout-api', 'cart-service', 'grpc'],
  ['checkout-api', 'pricing-engine', 'grpc'],
  ['checkout-api', 'inventory-service', 'grpc'],
  ['checkout-api', 'payments-api', 'grpc'],
  ['checkout-api', 'orders-db', 'query'],
  ['checkout-api', 'event-bus', 'event'],
  ['inventory-service', 'orders-db', 'query'],
  ['payments-api', 'fraud-scorer', 'grpc'],
  ['payments-api', 'stripe-gateway', 'http'],
  ['payments-api', 'payments-db', 'query'],
  ['payments-api', 'ledger-queue', 'event'],
  ['ledger-queue', 'ledger-service', 'event'],
  ['ledger-service', 'payments-db', 'query'],
  ['refunds-worker', 'payments-api', 'grpc'],
  ['refunds-worker', 'ledger-queue', 'event'],
  ['fraud-scorer', 'feature-store', 'query'],
  ['fraud-scorer', 'model-registry', 'http'],
  ['event-bus', 'stream-processor', 'event'],
  ['event-bus', 'notification-service', 'event'],
  ['event-bus', 'refunds-worker', 'event'],
  ['stream-processor', 'analytics-warehouse', 'query'],
  ['stream-processor', 'feature-store', 'query'],
  ['stream-processor', 'metrics-store', 'query'],
  ['etl-worker', 'orders-db', 'query'],
  ['etl-worker', 'analytics-warehouse', 'query'],
  ['log-pipeline', 'metrics-store', 'event'],
  ['api-gateway', 'log-pipeline', 'event'],
  ['recommender', 'feature-store', 'query'],
  ['recommender', 'vector-db', 'query'],
  ['recommender', 'model-registry', 'http'],
  ['embedding-worker', 'vector-db', 'query'],
  ['embedding-worker', 'catalog-db', 'query'],
  ['embedding-worker', 'llm-gateway', 'grpc'],
  ['insight-agent', 'llm-gateway', 'grpc'],
  ['insight-agent', 'metrics-store', 'query'],
  ['insight-agent', 'vector-db', 'query'],
  ['notification-service', 'push-queue', 'event'],
  ['notification-service', 'email-provider', 'http'],
  ['notification-service', 'sms-provider', 'http'],
  ['notification-service', 'users-db', 'query'],
]

const BASELINE: Record<NodeType, NodeMetrics> = {
  gateway: { cpu: 38, memory: 42, latencyMs: 24, rps: 5200, errorRate: 0.3 },
  service: { cpu: 34, memory: 48, latencyMs: 85, rps: 900, errorRate: 0.4 },
  database: { cpu: 41, memory: 66, latencyMs: 14, rps: 2400, errorRate: 0.1 },
  queue: { cpu: 28, memory: 52, latencyMs: 9, rps: 3600, errorRate: 0.05 },
  cache: { cpu: 22, memory: 61, latencyMs: 2, rps: 7800, errorRate: 0.02 },
  ai: { cpu: 58, memory: 71, latencyMs: 180, rps: 220, errorRate: 0.6 },
  external: { cpu: 0, memory: 0, latencyMs: 140, rps: 400, errorRate: 0.5 },
}

const STATUS_RANK: Record<Status, number> = { active: 0, warning: 1, critical: 2 }

export function worstStatus(a: Status, b: Status): Status {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b
}

export interface StatusVerdict {
  status: Status
  reason: string
  metric?: TriggerMetric
  value?: number
  threshold?: number
}

const STATUS_RULES: { status: Exclude<Status, 'active'>; metric: TriggerMetric; threshold: number }[] = [
  { status: 'critical', metric: 'errorRate', threshold: 5 },
  { status: 'critical', metric: 'cpu', threshold: 92 },
  { status: 'critical', metric: 'latencyMs', threshold: 600 },
  { status: 'warning', metric: 'errorRate', threshold: 2 },
  { status: 'warning', metric: 'cpu', threshold: 78 },
  { status: 'warning', metric: 'latencyMs', threshold: 300 },
]

const describeMetric = (metric: TriggerMetric, v: number) =>
  metric === 'errorRate' ? `errorRate ${v.toFixed(1)}%` : metric === 'cpu' ? `cpu ${v.toFixed(0)}%` : `p95 ${v.toFixed(0)}ms`

export function deriveStatus(m: NodeMetrics): StatusVerdict {
  for (const r of STATUS_RULES) {
    const value = m[r.metric]
    if (value >= r.threshold) {
      const unit = r.metric === 'latencyMs' ? 'ms' : '%'
      return { status: r.status, reason: `${describeMetric(r.metric, value)} ≥ ${r.threshold}${unit}`, metric: r.metric, value, threshold: r.threshold }
    }
  }
  return { status: 'active', reason: 'all metrics within thresholds' }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round1 = (v: number) => Math.round(v * 10) / 10

function metricsFor(type: NodeType, stress: number, rng: () => number, scale: number): NodeMetrics {
  const b = BASELINE[type]
  const jitter = () => 1 + (rng() - 0.5) * 0.12
  const s = stress * stress
  return {
    cpu: type === 'external' ? 0 : round1(clamp(b.cpu * jitter() + s * 62, 1, 99.5)),
    memory: type === 'external' ? 0 : round1(clamp(b.memory * jitter() + s * 30, 1, 99)),
    latencyMs: Math.round(b.latencyMs * jitter() * (1 + s * 9)),
    rps: Math.round(b.rps * scale * jitter() * (1 + stress * 0.4)),
    errorRate: round1(clamp(b.errorRate * jitter() + s * 9, 0, 100)),
  }
}

function sphericalCenters(count: number, radius: number, rng: () => number): Vec3[] {
  const out: Vec3[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i + rng() * 0.4
    out.push([Math.cos(theta) * r * radius, y * radius * 0.6, Math.sin(theta) * r * radius])
  }
  return out
}

interface SimState {
  stress: Map<string, number>
  drift: Map<string, number>
  scale: Map<string, number>
}

function initialStress(rng: () => number, ids: string[]): Map<string, number> {
  const stress = new Map<string, number>()
  for (const id of ids) stress.set(id, rng() * 0.35)
  const hot = [...ids].sort(() => rng() - 0.5)
  hot.slice(0, 3).forEach((id) => stress.set(id, 0.82 + rng() * 0.15))
  hot.slice(3, 8).forEach((id) => stress.set(id, 0.6 + rng() * 0.15))
  return stress
}

function buildEdges(nodes: GraphNode[], rng: () => number): GraphEdge[] {
  const byId = new Map(nodes.map((nd) => [nd.id, nd]))
  return LINKS.map(([source, target, kind]) => {
    const s = byId.get(source)!
    const t = byId.get(target)!
    return {
      id: `${source}->${target}`,
      source,
      target,
      kind,
      throughput: Math.round(Math.min(s.metrics.rps, Math.max(t.metrics.rps, 50)) * (0.3 + rng() * 0.5)),
      latencyMs: Math.round(t.metrics.latencyMs * (1 + rng() * 0.15)),
      status: worstStatus(s.status, t.status),
    }
  })
}

export function generateGraph(seed: number = DEFAULT_SEED): { snapshot: GraphSnapshot; state: SimState } {
  const rng = mulberry32(seed)
  const centers = sphericalCenters(CATALOG.length, 26, rng)
  const clusters: Cluster[] = CATALOG.map((c, i) => ({ id: c.id, label: c.label, color: c.color, center: centers[i] }))
  const ids = CATALOG.flatMap((c) => c.nodes.map((nd) => nd.id))
  const state: SimState = {
    stress: initialStress(rng, ids),
    drift: new Map(ids.map((id) => [id, (rng() - 0.5) * 0.02])),
    scale: new Map(ids.map((id) => [id, 0.5 + rng() * 1.2])),
  }

  const nodes: GraphNode[] = CATALOG.flatMap((c, ci) =>
    c.nodes.map((spec) => {
      const center = centers[ci]
      const metrics = metricsFor(spec.type, state.stress.get(spec.id)!, rng, state.scale.get(spec.id)!)
      const major = 1 + Math.floor(rng() * 4)
      return {
        id: spec.id,
        label: spec.label,
        type: spec.type,
        status: deriveStatus(metrics).status,
        cluster: c.id,
        description: spec.description,
        owner: c.owner,
        version: spec.type === 'external' ? 'saas' : `v${major}.${Math.floor(rng() * 20)}.${Math.floor(rng() * 10)}`,
        region: c.region,
        tags: spec.tags,
        metrics,
        position: [
          center[0] + (rng() - 0.5) * 12,
          center[1] + (rng() - 0.5) * 12,
          center[2] + (rng() - 0.5) * 12,
        ] as Vec3,
      }
    }),
  )

  return {
    snapshot: {
      version: API_VERSION,
      generatedAt: new Date().toISOString(),
      seed,
      clusters,
      nodes,
      edges: buildEdges(nodes, rng),
    },
    state,
  }
}

export interface Simulator {
  readonly snapshot: GraphSnapshot
  tick(): { tick: TelemetryTick; changes: StatusChange[] }
  resync(seed?: number): GraphSnapshot
}

export function createSimulator(seed: number = DEFAULT_SEED): Simulator {
  let { snapshot, state } = generateGraph(seed)
  let rng = mulberry32(seed ^ 0x9e3779b9)
  let seq = 0

  return {
    get snapshot() {
      return snapshot
    },
    tick() {
      seq++
      const changes: StatusChange[] = []
      const nodes = snapshot.nodes.map((node) => {
        let stress = state.stress.get(node.id)!
        let drift = state.drift.get(node.id)!
        drift = clamp(drift + (rng() - 0.5) * 0.03, -0.06, 0.06)
        if (rng() < 0.006) drift = 0.08
        if (stress > 0.9 && rng() < 0.08) drift = -0.07
        stress = clamp(stress + drift + (0.2 - stress) * 0.01, 0, 1)
        state.stress.set(node.id, stress)
        state.drift.set(node.id, drift)
        const metrics = metricsFor(node.type, stress, rng, state.scale.get(node.id)!)
        const { status, reason, metric, value, threshold } = deriveStatus(metrics)
        if (status !== node.status) {
          changes.push({ id: node.id, from: node.status, to: status, reason, ...(metric ? { metric, value, threshold } : {}) })
        }
        return { ...node, metrics, status }
      })
      const byId = new Map(nodes.map((nd) => [nd.id, nd]))
      const edges = snapshot.edges.map((e) => {
        const s = byId.get(e.source)!
        const t = byId.get(e.target)!
        const target = Math.min(s.metrics.rps, Math.max(t.metrics.rps, 50)) * 0.55
        return {
          ...e,
          throughput: Math.round(e.throughput * 0.7 + target * 0.3 * (0.85 + rng() * 0.3)),
          latencyMs: Math.round(t.metrics.latencyMs * (1 + rng() * 0.15)),
          status: worstStatus(s.status, t.status),
        }
      })
      snapshot = { ...snapshot, nodes, edges }
      return {
        tick: {
          seq,
          nodes: nodes.map(({ id, status, metrics }) => ({ id, status, metrics })),
          edges: edges.map(({ id, throughput, latencyMs, status }) => ({ id, throughput, latencyMs, status })),
        },
        changes,
      }
    },
    resync(nextSeed?: number) {
      const s = nextSeed ?? Math.floor(Math.random() * 2 ** 31)
      ;({ snapshot, state } = generateGraph(s))
      rng = mulberry32(s ^ 0x9e3779b9)
      return snapshot
    },
  }
}

export function applyTick(snapshot: GraphSnapshot, tick: TelemetryTick): GraphSnapshot {
  const nodeT = new Map(tick.nodes.map((t) => [t.id, t]))
  const edgeT = new Map(tick.edges.map((t) => [t.id, t]))
  return {
    ...snapshot,
    nodes: snapshot.nodes.map((nd) => {
      const t = nodeT.get(nd.id)
      return t ? { ...nd, status: t.status, metrics: t.metrics } : nd
    }),
    edges: snapshot.edges.map((e) => {
      const t = edgeT.get(e.id)
      return t ? { ...e, throughput: t.throughput, latencyMs: t.latencyMs, status: t.status } : e
    }),
  }
}

const fmtRps = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)

export function generateInsight(snapshot: GraphSnapshot, nodeId: string): Insight | null {
  const node = snapshot.nodes.find((nd) => nd.id === nodeId)
  if (!node) return null
  const byId = new Map(snapshot.nodes.map((nd) => [nd.id, nd]))
  const outbound = snapshot.edges.filter((e) => e.source === nodeId)
  const inbound = snapshot.edges.filter((e) => e.target === nodeId)
  const deps = outbound.map((e) => byId.get(e.target)!)
  const callers = inbound.map((e) => byId.get(e.source)!)
  const peers = snapshot.nodes.filter((nd) => nd.type === node.type && nd.id !== nodeId)
  const medianLatency = peers.length
    ? [...peers.map((p) => p.metrics.latencyMs)].sort((a, b) => a - b)[Math.floor(peers.length / 2)]
    : node.metrics.latencyMs
  const m = node.metrics
  const unhealthyDeps = deps.filter((d) => d.status !== 'active').sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status])
  const unhealthyCallers = callers.filter((c) => c.status !== 'active')
  const latencyRatio = medianLatency > 0 ? m.latencyMs / medianLatency : 1

  const findings: string[] = []
  const recommendations: string[] = []

  if (m.errorRate >= 2) findings.push(`Error rate at ${m.errorRate.toFixed(1)}% (threshold 2%), ${fmtRps((m.rps * m.errorRate) / 100)} failed req/s.`)
  if (latencyRatio >= 1.8) findings.push(`p95 latency ${m.latencyMs}ms is ${latencyRatio.toFixed(1)}× the ${node.type} fleet median (${medianLatency}ms).`)
  if (node.type !== 'external' && m.cpu >= 78) findings.push(`CPU saturation at ${m.cpu.toFixed(0)}% with memory at ${m.memory.toFixed(0)}%.`)
  if (unhealthyDeps.length) findings.push(`${unhealthyDeps.length} downstream dependenc${unhealthyDeps.length === 1 ? 'y is' : 'ies are'} degraded: ${unhealthyDeps.map((d) => `${d.label} (${d.status})`).join(', ')}.`)
  if (unhealthyCallers.length && node.status !== 'active') findings.push(`Blast radius: ${unhealthyCallers.length} upstream caller(s) already showing symptoms — ${unhealthyCallers.map((c) => c.label).join(', ')}.`)
  const hotEdge = [...outbound, ...inbound].sort((a, b) => b.throughput - a.throughput)[0]
  if (hotEdge) findings.push(`Busiest link ${hotEdge.source} → ${hotEdge.target} carries ${fmtRps(hotEdge.throughput)} req/s over ${hotEdge.kind}.`)

  let severity: InsightSeverity = 'info'
  let headline: string
  let summary: string
  const rootDep = unhealthyDeps[0]

  if (node.status === 'critical' || node.status === 'warning') {
    severity = node.status === 'critical' ? 'critical' : 'warning'
    if (rootDep && STATUS_RANK[rootDep.status] >= STATUS_RANK[node.status]) {
      headline = `Cascading degradation from ${rootDep.label}`
      summary = `${node.label} is ${node.status} primarily because its dependency ${rootDep.label} is ${rootDep.status} (p95 ${rootDep.metrics.latencyMs}ms, errors ${rootDep.metrics.errorRate.toFixed(1)}%). Requests are queueing on the ${outbound.find((e) => e.target === rootDep.id)?.kind ?? 'downstream'} link, inflating latency and triggering retries.`
      recommendations.push(`Open a circuit breaker on ${node.id} → ${rootDep.id} and serve degraded responses.`)
      recommendations.push(`Investigate ${rootDep.label} first — fixing it should recover ${node.label} automatically.`)
      recommendations.push('Cap client retries with jittered backoff to avoid a retry storm.')
    } else if (node.type !== 'external' && m.cpu >= 78) {
      headline = `${node.label} is compute-saturated`
      summary = `${node.label} is running hot at ${m.cpu.toFixed(0)}% CPU while serving ${fmtRps(m.rps)} req/s. Latency has risen to ${m.latencyMs}ms, consistent with thread-pool exhaustion rather than a dependency failure.`
      recommendations.push(`Scale ${node.id} horizontally (+${Math.max(2, Math.round(m.cpu / 30))} replicas) or raise the HPA ceiling.`)
      recommendations.push('Profile the hottest endpoints; enable response caching where safe.')
      if (node.type === 'database') recommendations.push('Check slow-query log and connection-pool saturation; consider a read replica.')
    } else if (node.type === 'external') {
      headline = `Third-party degradation: ${node.label}`
      summary = `${node.label} is an external provider returning ${m.errorRate.toFixed(1)}% errors at ${m.latencyMs}ms p95. This is outside your control plane — mitigate on the calling side.`
      recommendations.push(`Check the ${node.label} status page and open a vendor ticket if it persists.`)
      recommendations.push(`Tighten timeouts on callers (${callers.map((c) => c.id).join(', ') || 'n/a'}) and enable fallback / queued retries.`)
    } else if (m.errorRate >= 2) {
      headline = `Elevated error rate on ${node.label}`
      summary = `${node.label} is returning ${m.errorRate.toFixed(1)}% errors with otherwise healthy dependencies — pattern suggests a bad deploy (${node.version}) or an upstream contract change.`
      recommendations.push(`Compare error signatures before/after the ${node.version} rollout and roll back if correlated.`)
      recommendations.push('Enable canary analysis on the next deploy.')
    } else {
      headline = `Latency regression on ${node.label}`
      summary = `${node.label} p95 has climbed to ${m.latencyMs}ms (${latencyRatio.toFixed(1)}× fleet median) without CPU pressure, pointing to I/O wait, lock contention or a cold cache.`
      recommendations.push('Inspect traces for the slowest spans and check cache hit ratio.')
      recommendations.push(`Add a latency SLO alert on ${node.id} at ${Math.round(medianLatency * 2)}ms.`)
    }
    if (callers.length) recommendations.push(`Notify owners of ${callers.length} upstream service(s); ${node.owner} is the accountable team.`)
  } else if (unhealthyDeps.length) {
    severity = 'warning'
    headline = `Healthy, but exposed to ${unhealthyDeps[0].label}`
    summary = `${node.label} is within thresholds, yet ${unhealthyDeps.length} of its ${deps.length} dependencies are degraded. Expect latency to rise if ${unhealthyDeps[0].label} does not recover.`
    recommendations.push(`Pre-emptively verify timeouts and fallbacks on ${node.id} → ${unhealthyDeps[0].id}.`)
    recommendations.push('Watch the p95 trend over the next 5 minutes.')
  } else {
    headline = `${node.label} is healthy`
    summary = `All golden signals are nominal: ${m.latencyMs}ms p95, ${m.errorRate.toFixed(1)}% errors, ${fmtRps(m.rps)} req/s. ${deps.length ? `All ${deps.length} dependencies are healthy.` : 'No downstream dependencies.'}`
    recommendations.push(node.type !== 'external' && m.cpu < 30 ? `Utilisation is low (${m.cpu.toFixed(0)}% CPU) — candidate for right-sizing.` : 'No action required.')
  }

  const confidence = clamp(0.62 + findings.length * 0.06 + (rootDep ? 0.08 : 0), 0, 0.97)

  return {
    id: `ins_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
    nodeId,
    severity,
    headline,
    summary,
    findings,
    recommendations,
    confidence: Math.round(confidence * 100) / 100,
    model: 'lumora-heuristic-v1',
    generatedAt: new Date().toISOString(),
  }
}
