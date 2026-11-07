# Lumora-AI
Lumora is an immersive, AI-powered 3D data visualisation platform that transforms complex information into interactive, glowing constellations. Built with Three.js, React and MediaPipe, it enables users to explore dynamic data universes through natural hand gestures, spatial interactions and intelligent visualization.

## Data Constellation dashboard

A live 3D topology of a microservice platform: glowing nodes coloured by health, pulsing edges for data
flow, a glassmorphism control dock, and a node inspector with live metrics and AI diagnostics.

| Path | What |
| --- | --- |
| [`docs/`](docs) | Design specs — [architecture](docs/architecture.md), [API](docs/api_spec.md), [UI/UX wireframe](docs/ui_ux_wireframe.md) |
| [`shared/graph.ts`](shared/graph.ts) | Data model, seeded graph generator, telemetry simulator, heuristic insight engine (used by server and browser) |
| [`server/`](server) | Mock REST + WebSocket telemetry API (Express + ws) on `:8787` |
| [`frontend/`](frontend) | Vite + React 19 + Tailwind v4 + React Three Fiber app on `:5173` |

### Run it

Requires Node.js ≥ 22.18 (the server runs TypeScript directly via Node's built-in type stripping).

```bash
# terminal 1 — mock API (optional)
cd server && npm install && npm start

# terminal 2 — dashboard
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. Without the API the dashboard switches to **SIMULATED** mode and runs the same
telemetry engine in the browser, so it always demos. With the API running it shows **LIVE**.

### Controls

Drag to orbit, scroll to zoom, click a node to fly to it and open the inspector.
Shortcuts: `/` search · `Esc` close · `R` re-sync · `P` physics · `L` labels.

Alerts collect under the bell in the top bar. The inspector shows a risk meter and **Source & logs** buttons
(simulated logs, traces and runbook in-app). To point them at real tools, copy
[`frontend/.env.example`](frontend/.env.example) to `frontend/.env.local` and set the URL templates.
