import { create } from 'zustand'
import { applyTick, NODE_TYPES, STATUSES } from '@shared/graph.ts'
import type { GraphSnapshot, Insight, NodeMetrics, NodeType, Status, StatusChange, TelemetryTick } from '@shared/graph.ts'
import type { ThemeId } from './lib/themes.ts'

const HISTORY_LENGTH = 40
const MAX_EVENTS = 5

export type Connection = 'connecting' | 'live' | 'simulated'

export interface FeedEvent extends StatusChange {
  key: string
  at: number
}

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface LumoraState {
  graph: GraphSnapshot | null
  history: Record<string, NodeMetrics[]>
  connection: Connection
  lastSyncAt: number | null
  syncing: boolean
  events: FeedEvent[]

  selectedId: string | null
  hoveredId: string | null

  typeFilter: Record<NodeType, boolean>
  statusFilter: Record<Status, boolean>
  physics: boolean
  gravity: number
  scatterNonce: number
  showLabels: boolean
  autoRotate: boolean
  showFlow: boolean
  theme: ThemeId
  dockCollapsed: boolean

  insights: Record<string, Insight>
  insightLoading: Record<string, boolean>
  insightError: Record<string, string | null>

  setGraph: (graph: GraphSnapshot) => void
  ingestTick: (tick: TelemetryTick) => void
  pushEvents: (changes: StatusChange[]) => void
  setConnection: (c: Connection) => void
  setSyncing: (v: boolean) => void
  select: (id: string | null) => void
  hover: (id: string | null) => void
  toggleType: (t: NodeType) => void
  toggleStatus: (s: Status) => void
  setPhysics: (v: boolean) => void
  setGravity: (v: number) => void
  scatter: () => void
  setShowLabels: (v: boolean) => void
  setAutoRotate: (v: boolean) => void
  setShowFlow: (v: boolean) => void
  setTheme: (t: ThemeId) => void
  setDockCollapsed: (v: boolean) => void
  setInsightLoading: (id: string, v: boolean) => void
  setInsight: (insight: Insight) => void
  setInsightError: (id: string, err: string | null) => void
}

const allTrue = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, true])) as Record<K, boolean>

function appendHistory(history: Record<string, NodeMetrics[]>, graph: GraphSnapshot) {
  const next: Record<string, NodeMetrics[]> = {}
  for (const node of graph.nodes) {
    const prev = history[node.id] ?? []
    next[node.id] = [...prev.slice(-(HISTORY_LENGTH - 1)), node.metrics]
  }
  return next
}

export const useStore = create<LumoraState>()((set, get) => ({
  graph: null,
  history: {},
  connection: 'connecting',
  lastSyncAt: null,
  syncing: false,
  events: [],

  selectedId: null,
  hoveredId: null,

  typeFilter: allTrue(NODE_TYPES),
  statusFilter: allTrue(STATUSES),
  physics: true,
  gravity: 55,
  scatterNonce: 0,
  showLabels: true,
  autoRotate: !prefersReducedMotion,
  showFlow: true,
  theme: 'nebula',
  dockCollapsed: typeof window !== 'undefined' && window.innerWidth < 1024,

  insights: {},
  insightLoading: {},
  insightError: {},

  setGraph: (graph) => {
    const { selectedId } = get()
    set({
      graph,
      history: appendHistory({}, graph),
      lastSyncAt: Date.now(),
      selectedId: selectedId && graph.nodes.some((nd) => nd.id === selectedId) ? selectedId : null,
      insights: {},
      insightError: {},
    })
  },
  ingestTick: (tick) => {
    const { graph, history } = get()
    if (!graph) return
    const next = applyTick(graph, tick)
    set({ graph: next, history: appendHistory(history, next) })
  },
  pushEvents: (changes) => {
    if (!changes.length) return
    const now = Date.now()
    const fresh = changes.map((c, i) => ({ ...c, key: `${now}-${i}-${c.id}`, at: now }))
    set({ events: [...fresh, ...get().events].slice(0, MAX_EVENTS) })
  },
  setConnection: (connection) => set({ connection }),
  setSyncing: (syncing) => set({ syncing }),
  select: (selectedId) => set({ selectedId }),
  hover: (hoveredId) => set({ hoveredId }),
  toggleType: (t) => set({ typeFilter: { ...get().typeFilter, [t]: !get().typeFilter[t] } }),
  toggleStatus: (s) => set({ statusFilter: { ...get().statusFilter, [s]: !get().statusFilter[s] } }),
  setPhysics: (physics) => set({ physics }),
  setGravity: (gravity) => set({ gravity }),
  scatter: () => set({ scatterNonce: get().scatterNonce + 1, physics: true }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setShowFlow: (showFlow) => set({ showFlow }),
  setTheme: (theme) => set({ theme }),
  setDockCollapsed: (dockCollapsed) => set({ dockCollapsed }),
  setInsightLoading: (id, v) => set({ insightLoading: { ...get().insightLoading, [id]: v } }),
  setInsight: (insight) => set({ insights: { ...get().insights, [insight.nodeId]: insight } }),
  setInsightError: (id, err) => set({ insightError: { ...get().insightError, [id]: err } }),
}))

export function useVisibleIds(): Set<string> {
  const graph = useStore((s) => s.graph)
  const typeFilter = useStore((s) => s.typeFilter)
  const statusFilter = useStore((s) => s.statusFilter)
  return visibleIds(graph, typeFilter, statusFilter)
}

let cacheKey: unknown[] = []
let cacheValue = new Set<string>()

function visibleIds(
  graph: GraphSnapshot | null,
  typeFilter: Record<NodeType, boolean>,
  statusFilter: Record<Status, boolean>,
): Set<string> {
  if (cacheKey[0] === graph && cacheKey[1] === typeFilter && cacheKey[2] === statusFilter) return cacheValue
  cacheKey = [graph, typeFilter, statusFilter]
  cacheValue = new Set(
    (graph?.nodes ?? []).filter((nd) => typeFilter[nd.type] && statusFilter[nd.status]).map((nd) => nd.id),
  )
  return cacheValue
}
