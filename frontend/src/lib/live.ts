import { createSimulator, DEFAULT_TICK_MS, generateInsight } from '@shared/graph.ts'
import type { GraphSnapshot, Insight, ServerEvent, Simulator } from '@shared/graph.ts'
import { useStore } from '../store.ts'

const MIN_INSIGHT_MS = 900
const MAX_BACKOFF_MS = 15_000

let socket: WebSocket | null = null
let simulator: Simulator | null = null
let simTimer: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let backoff = 1000
let started = false

const store = () => useStore.getState()
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
    signal: init?.signal ?? AbortSignal.timeout(4000),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

function stopSimulation() {
  if (simTimer) clearInterval(simTimer)
  simTimer = null
}

function startSimulation() {
  if (simTimer) return
  const graph = store().graph
  simulator = createSimulator(graph?.seed)
  if (!graph) store().setGraph(simulator.snapshot)
  store().setConnection('simulated')
  simTimer = setInterval(() => {
    const { tick, changes } = simulator!.tick()
    store().ingestTick(tick)
    store().pushEvents(changes)
  }, DEFAULT_TICK_MS)
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    void connect()
  }, backoff)
  backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
}

function handleEvent(evt: ServerEvent) {
  switch (evt.type) {
    case 'telemetry.tick':
      store().ingestTick(evt.payload)
      break
    case 'node.status_changed':
      store().pushEvents([evt.payload])
      break
    case 'graph.resynced':
      store().setGraph(evt.payload)
      break
    case 'insight.generated':
      store().setInsight(evt.payload)
      break
    default:
      break
  }
}

function openSocket() {
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`
  const ws = new WebSocket(url)
  socket = ws
  ws.onopen = () => {
    backoff = 1000
    stopSimulation()
    store().setConnection('live')
  }
  ws.onmessage = (msg) => {
    try {
      handleEvent(JSON.parse(msg.data) as ServerEvent)
    } catch {
      /* ignore malformed frames */
    }
  }
  ws.onclose = () => {
    if (socket !== ws) return
    socket = null
    startSimulation()
    scheduleReconnect()
  }
}

async function connect() {
  try {
    const graph = await api<GraphSnapshot>('/api/graph')
    store().setGraph(graph)
    openSocket()
  } catch {
    startSimulation()
    scheduleReconnect()
  }
}

export function startLive() {
  if (started) return
  started = true
  void connect()
}

export const isLive = () => socket?.readyState === WebSocket.OPEN

export async function resync() {
  const s = store()
  if (s.syncing) return
  s.setSyncing(true)
  try {
    const started = Date.now()
    if (isLive()) {
      store().setGraph(await api<GraphSnapshot>('/api/resync', { method: 'POST', body: '{}' }))
    } else {
      simulator ??= createSimulator()
      store().setGraph(simulator.resync())
    }
    await wait(Math.max(0, 600 - (Date.now() - started)))
  } catch {
    simulator ??= createSimulator()
    store().setGraph(simulator.resync())
  } finally {
    store().setSyncing(false)
  }
}

export async function requestInsight(nodeId: string) {
  const s = store()
  if (s.insightLoading[nodeId]) return
  s.setInsightLoading(nodeId, true)
  s.setInsightError(nodeId, null)
  const started = Date.now()
  try {
    let insight: Insight | null
    if (isLive()) {
      insight = await api<Insight>('/api/insights', { method: 'POST', body: JSON.stringify({ nodeId }) })
    } else {
      const graph = store().graph
      insight = graph ? generateInsight(graph, nodeId) : null
    }
    await wait(Math.max(0, MIN_INSIGHT_MS - (Date.now() - started)))
    if (!insight) throw new Error('Unknown node')
    store().setInsight(insight)
  } catch (err) {
    store().setInsightError(nodeId, err instanceof Error ? err.message : 'Insight request failed')
  } finally {
    store().setInsightLoading(nodeId, false)
  }
}
