import { createServer } from 'node:http'
import cors from 'cors'
import express from 'express'
import { WebSocket, WebSocketServer } from 'ws'
import { createSimulator, DEFAULT_SEED, DEFAULT_TICK_MS, generateInsight } from '../shared/graph.ts'
import type { ServerEvent } from '../shared/graph.ts'

const PORT = Number(process.env.PORT ?? 8787)
const TICK_MS = Number(process.env.TICK_MS ?? DEFAULT_TICK_MS)
const SERVER_VERSION = '1.0.0'
const startedAt = Date.now()

const sim = createSimulator(Number(process.env.SEED ?? DEFAULT_SEED))
const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

function envelope(type: ServerEvent['type'], payload: unknown): string {
  return JSON.stringify({ type, ts: new Date().toISOString(), payload })
}

function broadcast(type: ServerEvent['type'], payload: unknown) {
  const msg = envelope(type, payload)
  for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(msg)
}

const apiError = (res: express.Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } })

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptimeS: Math.round((Date.now() - startedAt) / 1000), clients: wss.clients.size, tickMs: TICK_MS })
})

app.get('/api/graph', (_req, res) => {
  res.json(sim.snapshot)
})

app.get('/api/nodes/:id', (req, res) => {
  const { snapshot } = sim
  const node = snapshot.nodes.find((nd) => nd.id === req.params.id)
  if (!node) return apiError(res, 404, 'NODE_NOT_FOUND', `No node with id '${req.params.id}'`)
  res.json({
    node,
    inbound: snapshot.edges.filter((e) => e.target === node.id),
    outbound: snapshot.edges.filter((e) => e.source === node.id),
  })
})

app.post('/api/insights', (req, res) => {
  const nodeId = req.body?.nodeId
  if (typeof nodeId !== 'string' || !nodeId) return apiError(res, 400, 'BAD_REQUEST', 'Body must include a string "nodeId"')
  const insight = generateInsight(sim.snapshot, nodeId)
  if (!insight) return apiError(res, 404, 'NODE_NOT_FOUND', `No node with id '${nodeId}'`)
  broadcast('insight.generated', insight)
  res.json(insight)
})

app.post('/api/resync', (req, res) => {
  const seed = req.body?.seed
  const snapshot = sim.resync(typeof seed === 'number' ? seed : undefined)
  broadcast('graph.resynced', snapshot)
  res.json(snapshot)
})

app.use('/api', (_req, res) => apiError(res, 404, 'NOT_FOUND', 'Unknown endpoint'))

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  apiError(res, 500, 'INTERNAL', 'Internal server error')
})

wss.on('connection', (socket) => {
  socket.send(envelope('hello', { serverVersion: SERVER_VERSION, tickMs: TICK_MS }))
  socket.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg?.type === 'ping') socket.send(envelope('pong', {}))
    } catch {
      /* ignore malformed client frames */
    }
  })
})

setInterval(() => {
  const { tick, changes } = sim.tick()
  broadcast('telemetry.tick', tick)
  for (const change of changes) broadcast('node.status_changed', change)
}, TICK_MS)

httpServer.listen(PORT, () => {
  console.log(`Lumora API listening on http://localhost:${PORT} (ws: /ws, tick ${TICK_MS}ms)`)
})
