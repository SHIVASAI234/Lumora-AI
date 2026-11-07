# Lumora AI — API Specification

Base URL (dev): `http://localhost:8787` — the Vite dev server proxies `/api` and `/ws` so the frontend
always uses relative URLs. All payloads are JSON, UTF-8. Timestamps are ISO-8601 strings in UTC.
TypeScript definitions live in [`shared/graph.ts`](../shared/graph.ts) and are the canonical source; the
JSON Schemas below mirror them.

## 1. Entity schemas

### 1.1 Enumerations

| Name | Values |
| --- | --- |
| `NodeType` | `gateway`, `service`, `database`, `queue`, `cache`, `ai`, `external` |
| `Status` | `active`, `warning`, `critical` |
| `EdgeKind` | `http`, `grpc`, `event`, `query` |
| `InsightSeverity` | `info`, `warning`, `critical` |

### 1.2 `NodeMetrics`

```json
{
  "$id": "NodeMetrics",
  "type": "object",
  "required": ["cpu", "memory", "latencyMs", "rps", "errorRate"],
  "properties": {
    "cpu":       { "type": "number", "minimum": 0, "maximum": 100, "description": "CPU utilisation %" },
    "memory":    { "type": "number", "minimum": 0, "maximum": 100, "description": "Memory utilisation %" },
    "latencyMs": { "type": "number", "minimum": 0, "description": "p95 latency in milliseconds" },
    "rps":       { "type": "number", "minimum": 0, "description": "Requests (or messages) per second" },
    "errorRate": { "type": "number", "minimum": 0, "maximum": 100, "description": "Error rate %" }
  }
}
```

### 1.3 `GraphNode`

```json
{
  "$id": "GraphNode",
  "type": "object",
  "required": ["id", "label", "type", "status", "cluster", "description", "owner", "version", "region", "tags", "metrics", "position"],
  "properties": {
    "id":          { "type": "string", "pattern": "^[a-z0-9-]+$", "example": "payments-api" },
    "label":       { "type": "string", "example": "Payments API" },
    "type":        { "enum": ["gateway", "service", "database", "queue", "cache", "ai", "external"] },
    "status":      { "enum": ["active", "warning", "critical"] },
    "cluster":     { "type": "string", "description": "Cluster.id this node belongs to" },
    "description": { "type": "string" },
    "owner":       { "type": "string", "example": "team-payments" },
    "version":     { "type": "string", "example": "v2.14.1" },
    "region":      { "type": "string", "example": "eu-west-1" },
    "tags":        { "type": "array", "items": { "type": "string" } },
    "metrics":     { "$ref": "NodeMetrics" },
    "position":    { "type": "array", "items": { "type": "number" }, "minItems": 3, "maxItems": 3,
                     "description": "Seed [x, y, z] position; the client force layout refines it" }
  }
}
```

### 1.4 `GraphEdge`

```json
{
  "$id": "GraphEdge",
  "type": "object",
  "required": ["id", "source", "target", "kind", "throughput", "latencyMs", "status"],
  "properties": {
    "id":         { "type": "string", "example": "checkout-api->payments-api" },
    "source":     { "type": "string", "description": "GraphNode.id (caller / producer)" },
    "target":     { "type": "string", "description": "GraphNode.id (callee / consumer)" },
    "kind":       { "enum": ["http", "grpc", "event", "query"] },
    "throughput": { "type": "number", "minimum": 0, "description": "Requests or messages per second" },
    "latencyMs":  { "type": "number", "minimum": 0 },
    "status":     { "enum": ["active", "warning", "critical"], "description": "Worst status of the two endpoints" }
  }
}
```

### 1.5 `Cluster`

```json
{
  "$id": "Cluster",
  "type": "object",
  "required": ["id", "label", "color", "center"],
  "properties": {
    "id":     { "type": "string", "example": "payments" },
    "label":  { "type": "string", "example": "Payments" },
    "color":  { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" },
    "center": { "type": "array", "items": { "type": "number" }, "minItems": 3, "maxItems": 3 }
  }
}
```

### 1.6 `GraphSnapshot`

```json
{
  "$id": "GraphSnapshot",
  "type": "object",
  "required": ["version", "generatedAt", "seed", "clusters", "nodes", "edges"],
  "properties": {
    "version":     { "type": "string", "example": "1.0" },
    "generatedAt": { "type": "string", "format": "date-time" },
    "seed":        { "type": "integer" },
    "clusters":    { "type": "array", "items": { "$ref": "Cluster" } },
    "nodes":       { "type": "array", "items": { "$ref": "GraphNode" } },
    "edges":       { "type": "array", "items": { "$ref": "GraphEdge" } }
  }
}
```

### 1.7 `Insight`

```json
{
  "$id": "Insight",
  "type": "object",
  "required": ["id", "nodeId", "severity", "headline", "summary", "findings", "recommendations", "confidence", "model", "generatedAt"],
  "properties": {
    "id":              { "type": "string" },
    "nodeId":          { "type": "string" },
    "severity":        { "enum": ["info", "warning", "critical"] },
    "headline":        { "type": "string", "example": "Latency spike propagating from payments-db" },
    "summary":         { "type": "string" },
    "findings":        { "type": "array", "items": { "type": "string" } },
    "recommendations": { "type": "array", "items": { "type": "string" } },
    "confidence":      { "type": "number", "minimum": 0, "maximum": 1 },
    "model":           { "type": "string", "example": "lumora-heuristic-v1" },
    "generatedAt":     { "type": "string", "format": "date-time" }
  }
}
```

> The default insight engine is a deterministic heuristic (`lumora-heuristic-v1`) so demos work offline.
> The `model` field exists so an LLM-backed engine can be swapped in without changing the contract.

## 2. REST endpoints

| Method | Path | Body | Response | Notes |
| --- | --- | --- | --- | --- |
| `GET` | `/api/health` | – | `{ "status": "ok", "uptimeS": 42, "clients": 1, "tickMs": 1500 }` | Liveness |
| `GET` | `/api/graph` | – | `GraphSnapshot` | Current snapshot incl. latest telemetry |
| `GET` | `/api/nodes/:id` | – | `{ "node": GraphNode, "inbound": GraphEdge[], "outbound": GraphEdge[] }` | `404` if unknown |
| `POST` | `/api/insights` | `{ "nodeId": "payments-api" }` | `Insight` | `400` if `nodeId` missing, `404` if unknown. Also broadcast as `insight.generated` |
| `POST` | `/api/resync` | `{ "seed"?: number }` | `GraphSnapshot` | Re-rolls statuses/metrics; broadcasts `graph.resynced` |

### Error envelope

```json
{ "error": { "code": "NODE_NOT_FOUND", "message": "No node with id 'foo'" } }
```

| HTTP | `code` |
| --- | --- |
| 400 | `BAD_REQUEST` |
| 404 | `NODE_NOT_FOUND`, `NOT_FOUND` |
| 500 | `INTERNAL` |

## 3. WebSocket — real-time telemetry (`/ws`)

Every message in either direction uses one envelope:

```json
{ "type": "<event-name>", "ts": "2026-11-07T14:20:00.000Z", "payload": { } }
```

### 3.1 Server → client events

| `type` | `payload` | When |
| --- | --- | --- |
| `hello` | `{ "serverVersion": "1.0.0", "tickMs": 1500 }` | Immediately after connect |
| `telemetry.tick` | `TelemetryTick` | Every `tickMs` |
| `node.status_changed` | `{ "id": "payments-db", "from": "active", "to": "critical", "reason": "errorRate 7.2% > 5%" }` | When a tick changes a node's status |
| `graph.resynced` | `GraphSnapshot` | After `POST /api/resync` |
| `insight.generated` | `Insight` | After `POST /api/insights` (lets every screen show the insight) |
| `pong` | `{}` | Reply to `ping` |

`TelemetryTick` schema:

```json
{
  "$id": "TelemetryTick",
  "type": "object",
  "required": ["seq", "nodes", "edges"],
  "properties": {
    "seq": { "type": "integer", "description": "Monotonic tick counter" },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "status", "metrics"],
        "properties": {
          "id":      { "type": "string" },
          "status":  { "enum": ["active", "warning", "critical"] },
          "metrics": { "$ref": "NodeMetrics" }
        }
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "throughput", "latencyMs", "status"],
        "properties": {
          "id":         { "type": "string" },
          "throughput": { "type": "number" },
          "latencyMs":  { "type": "number" },
          "status":     { "enum": ["active", "warning", "critical"] }
        }
      }
    }
  }
}
```

Example:

```json
{
  "type": "telemetry.tick",
  "ts": "2026-11-07T14:20:01.500Z",
  "payload": {
    "seq": 128,
    "nodes": [
      { "id": "payments-db", "status": "critical",
        "metrics": { "cpu": 93.1, "memory": 81.4, "latencyMs": 640, "rps": 2210, "errorRate": 7.2 } }
    ],
    "edges": [
      { "id": "payments-api->payments-db", "throughput": 1980, "latencyMs": 610, "status": "critical" }
    ]
  }
}
```

### 3.2 Client → server events

| `type` | `payload` | Effect |
| --- | --- | --- |
| `ping` | `{}` | Server replies `pong` (keep-alive / latency probe) |

### 3.3 Status derivation

Status is derived from metrics on every tick (same function server- and client-side):

| Status | Rule (any) |
| --- | --- |
| `critical` | `errorRate ≥ 5` or `cpu ≥ 92` or `latencyMs ≥ 600` |
| `warning` | `errorRate ≥ 2` or `cpu ≥ 78` or `latencyMs ≥ 300` |
| `active` | otherwise |

### 3.4 Reconnection

The client reconnects with exponential backoff (1 s → 2 s → 4 s … max 15 s). While disconnected it
keeps simulating locally so the scene never freezes; on reconnect it calls `GET /api/graph` and replaces
local state.
