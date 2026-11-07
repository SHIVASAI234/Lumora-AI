# Lumora AI — UI/UX Wireframe Specification

Design goal: a dark, cinematic "space" canvas filling the viewport, with frosted-glass panels floating
above it. The 3D constellation is always the hero; overlays are translucent, collapsible and never cover
the centre of the scene.

## 1. Layout (desktop ≥ 1280 px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ◆ LUMORA AI   Data Constellation   ● LIVE  48 nodes · 73 links · 3 critical  🔔3  [⌘K ⌕]  │  ← Top bar (glass, 56px)
├────────────┬─────────────────────────────────────────────────────────────┬───────────────┤
│ CONTROL    │                                                             │  INSPECTOR    │
│ DOCK       │                    ·  ✦        ·                            │  DRAWER       │
│ (glass,    │         ✦────────✦               ✦                          │  (glass,      │
│  288px,    │        ╱  ╲       ╲   ·       ╱   ╲                         │   400px,      │
│  collaps-  │      ✦     ✦───────◉─────────✦     ✦      ·                 │   slides in   │
│  ible to   │       ╲   ╱      payments-db  ╲   ╱                         │   from right  │
│  64px)     │   ·    ✦          (selected)   ✦                            │   on select)  │
│            │                 ·           ·                               │               │
│ Node types │        ✦──✦                         ✦──✦──✦                 │  Header       │
│ Status     │                                                             │  Metrics ×5   │
│ Physics    │                                                             │  Connections  │
│ View/Theme │                                                             │  AI Insight   │
│ [Re-sync]  │   ┌─────────────────────────────┐                           │               │
│            │   │ ● Active ● Warning ● Critical [🔇 Muted]│  ← Legend + alarm toggle │               │
└────────────┴───┴─────────────────────────────┴───────────────────────────┴───────────────┘
```

- **Canvas**: `position: fixed; inset: 0`, behind everything (`z-0`). Overlays are `pointer-events-none`
  containers with `pointer-events-auto` panels so empty overlay space still orbits the camera.
- **Breakpoints**: `< 1024 px` → dock collapses to icon rail by default; `< 640 px` → inspector becomes a
  bottom sheet (70 vh); stats chips and legend are hidden.

## 2. Visual language

| Token | Value |
| --- | --- |
| Background | Theme-dependent radial gradient, e.g. Nebula `#05060f → #0b0820` |
| Glass panel | `bg-white/5`, `backdrop-blur-xl`, `border border-white/10`, `rounded-2xl`, `shadow-[0_8px_32px_rgba(0,0,0,.45)]` |
| Glass panel (hover) | `bg-white/[.08]`, border `white/20` |
| Text primary / secondary | `#e6e9ff` / `slate-400` |
| Font | Inter / system UI; numbers use `tabular-nums`; labels `text-[11px] uppercase tracking-[.18em]` |
| Status — active | `#34f5c5` (mint) |
| Status — warning | `#ffb547` (amber) |
| Status — critical | `#ff4d6d` (rose) |
| Accent (Nebula / Aurora / Solar) | `#8b5cf6` / `#22d3ee` / `#fb923c` |
| Motion | 300 ms `cubic-bezier(.22,1,.36,1)` for panels; camera fly-to ≈ 1.2 s ease-out |

### Themes

| Theme | Background | Edge colour | Accent | Bloom |
| --- | --- | --- | --- | --- |
| Nebula (default) | deep indigo | violet → cyan | violet | 1.4 |
| Aurora | midnight teal | teal → green | cyan | 1.2 |
| Solar | warm black | orange → magenta | orange | 1.6 |

## 3. Components

### 3.1 Top bar
- Left: logo glyph (animated gradient diamond) + "LUMORA AI" wordmark + subtitle "Data Constellation".
- Centre/right: connection pill — `● LIVE` (mint, pulsing) when the WebSocket is open, `◐ SIMULATED`
  (amber) in offline mode; stats chips (nodes, links, warning count, critical count — critical chip
  pulses red when > 0).
- **Notifications bell** (right of the stats): unread badge (red if any unread alert is critical, amber otherwise; the
  bell icon rings while a critical alert is unread). Opens a 400 px glass dropdown — see §3.6.
- Search box: type-ahead over node labels/ids; `Enter` selects and flies to the first match. `/` focuses it.

### 3.2 Control dock (left, 288 px, collapsible)
Sections separated by hairline dividers, each with an uppercase micro-label:

| Section | Controls |
| --- | --- |
| **Node types** | Toggle chips with type-tinted lucide icons and live counts: Gateway (Router), Service (Box), Database, Queue (ListOrdered), Cache (HardDrive), AI (Bot), External (Cloud). Inactive chips dim; node meshes of that type are hidden (and their edges). |
| **Status** | Three toggle chips (Active / Warning / Critical) with colour dots and live counts. |
| **Physics** | Switch "Particle physics" (force layout on/off). Slider "Gravity" 0–100 (cluster cohesion). Button "Scatter" (randomise positions & let physics settle). |
| **View** | Switches: "Labels", "Auto-rotate", "Flow particles", "Threat FX". Theme segmented control (Nebula / Aurora / Solar). Icon style segmented control (Standard / Hero). |
| **Data** | Primary button "Re-sync data" (spinner while in flight) + timestamp of last sync. |

Collapsed state: 64 px icon rail; hovering an icon shows a tooltip.

### 3.3 Inspector drawer (right, 400 px)
Opens when a node is selected (click in scene, search, or connection list). Slides in from the right
(`translate-x-full → 0`, 300 ms) while the camera flies to the node. Close via ✕, `Esc`, or clicking empty
space.

```
┌───────────────────────────────────────┐
│ [icon] Payments DB            ✕       │
│ database · payments · v14.2 · eu-w-1  │
│ ● CRITICAL                            │
│ ╭─╮ RISK  Severe                      │
│ 86  Error rate at 144% of limit,      │
│     rising · 6 dependents             │
│ "Primary ledger store…" description   │
├───────────────────────────────────────┤
│ SOURCE & LOGS                         │
│ [Logs  4 errors] [Traces]             │
│ [Source code ↗]  [Runbook]            │
├───────────────────────────────────────┤
│ LIVE METRICS                          │
│ ┌──────────┐ ┌──────────┐             │
│ │CPU  93% ~│ │MEM  81% ~│  sparkline  │
│ └──────────┘ └──────────┘  per card,  │
│ ┌──────────┐ ┌──────────┐  colour by  │
│ │p95 640ms~│ │RPS 2.2k ~│  threshold  │
│ └──────────┘ └──────────┘             │
│ ┌──────────────────────┐              │
│ │ERR  7.2%            ~│              │
│ └──────────────────────┘              │
├───────────────────────────────────────┤
│ CONNECTIONS (5)        in 3 · out 2   │
│ ← Payments API   grpc  1.9k/s  ●      │
│ → Ledger Queue   event   420/s ●      │
│   … (click row → select & fly)        │
├───────────────────────────────────────┤
│ ✦ AI DIAGNOSTICS        [Analyze ↻]   │
│ Headline (severity colour)            │
│ Summary paragraph (typewriter reveal) │
│ Findings • … • …                      │
│ Recommendations ✓ … ✓ …               │
│ confidence 0.86 · lumora-heuristic-v1 │
└───────────────────────────────────────┘
```

**Risk meter**: 0–100 gauge under the status pill. Score = threshold proximity (≤ 75, warning threshold ≈ 45,
critical ≈ 75) + 10 if the top metric is rising over the last ~15 s + up to 15 for dependents (scaled by pressure).
Levels: Low < 35 ≤ Elevated < 55 ≤ High < 75 ≤ Severe. The reason line names the metric closest to its limit.

**Source & logs**: Logs / Traces / Runbook open the in-app diagnostics viewer (below). Each button — and Source
code — becomes an external link when the matching `VITE_LOGS_URL` / `VITE_TRACES_URL` / `VITE_SOURCE_URL` /
`VITE_RUNBOOK_URL` template is set (placeholders `{id}`, `{label}`, `{cluster}`, `{owner}`, `{region}`, `{version}`).
Source code is disabled until `VITE_SOURCE_URL` is configured.

**Diagnostics viewer**: centred modal (840 × 620 max) with tabs —
*Logs* (simulated live tail derived from the node's metric history, newest first, level filters, ERROR rows tinted),
*Traces* (one trace per recent tick: root span + downstream-call spans as a waterfall, slow/error spans coloured),
*Runbook* (checklist generated from the riskiest metric and node type, on-call handle, escalation rule).
`Esc` or clicking the backdrop closes it.

States: *empty* (prompt "Run AI diagnostics"), *loading* (shimmer skeleton + "Analysing telemetry…"),
*result*, *error* (retry). A new insight for the selected node arriving via `insight.generated` replaces
the current one.

### 3.4 Legend (bottom-left of canvas)
Status colour dots, an alarm toggle (`Muted` by default → `Alarm on`; remembered in localStorage), and a hint row:
"Drag to orbit · Scroll to zoom · Click a star to inspect". With the alarm on, a short Web Audio two-tone plays when a
node turns critical (at most once every 4 s).

### 3.5 Hover tooltip
Small glass chip following the cursor when hovering a node: label, type, status dot, p95 latency.

### 3.6 Notifications (alert cards)
Alerts never pop over the scene. The last 50 `node.status_changed` events live in the bell dropdown, newest first,
with filter tabs (All / Critical / Warning / Recovered, each with a count) and **Mark all read**. Each
card shows the node's tinted type icon, label, type · cluster, time since the change, `from → to` status badges and the
breached metric (e.g. `Error rate 2.6% (warning ≥ 2%)`, or `Recovered` for → active), the node's current risk badge,
a **Logs** action (opens the diagnostics viewer) and a **View ‹metric›** action. Clicking a
card closes the dropdown, re-enables any filter hiding the node, flies the camera to it, opens the inspector and pulses the metric card that
triggered the alert (labelled **Alert trigger**) for ~5 s.

### 3.7 Threat mode
When "Threat FX" is on (default) and any node is critical: each critical node emits expanding red shockwave rings, and
the screen edges glow red (inset vignette whose size grows with the number of critical nodes, pulsing every 2.4 s).
Reduced-motion users get static rings and no pulse.

### 3.8 Icon styles
*Standard* uses lucide icons; *Hero* swaps in original comic-style glyphs — Gateway: star shield, Service: gauntlet,
Database: arc reactor, Queue: web, Cache: storm hammer, AI: visor helmet, External: portal ring. The choice applies to
the dock, search, inspector, connections, notifications and diagnostics viewer, and is remembered. In Hero mode every
node in the scene also wears its emblem: a round DOM badge projected onto the node centre (sized from the node's
on-screen radius, 22–72 px), ringed and glowing in the node's status colour with the glyph in its type colour. The text
label lifts above the badge. Emblems stay visible when labels are switched off.

### 3.9 Node labels
Constant-size white semibold pill labels (12 px) on a dark backing above each visible node, lightly faded by depth (min 65 %); the hovered/selected label is
brightened and non-neighbour labels fade when a node is selected. Toggle with the dock switch or `L`.

## 4. Scene interaction states

| State | Node visual | Edge visual |
| --- | --- | --- |
| Default | Emissive core in status colour, soft halo breathing (2–3 s) | Pulses travelling source → target in theme colour |
| Hovered | Scale ×1.35, ring appears, label brightens | Connected edges brighten |
| Selected | Ring spins, halo enlarges, camera flies in | Connected edges full intensity; unrelated nodes/edges fade to 25 % |
| Filtered out | Hidden | Hidden if either endpoint hidden |
| Critical | Faster halo pulse + stronger bloom | Edge tinted rose |

## 5. Keyboard & accessibility

| Key | Action |
| --- | --- |
| `/` | Focus search |
| `Esc` | Close inspector / clear selection |
| `R` | Re-sync data |
| `P` | Toggle physics |
| `L` | Toggle labels |

- All dock controls are real `<button>` / `<input>` elements with `aria-pressed` / labels.
- Status is never conveyed by colour alone: the inspector shows status text, and the tooltip names it.
- Respect `prefers-reduced-motion`: disable auto-rotate and shorten camera transitions.
