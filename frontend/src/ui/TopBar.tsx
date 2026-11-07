import { Search, WifiOff } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { STATUS_COLORS, TYPE_LABELS } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import { TYPE_ICONS } from './icons.ts'

function ConnectionPill() {
  const connection = useStore((s) => s.connection)
  if (connection === 'live')
    return (
      <span className="flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[11px] font-semibold tracking-[.18em] text-mint">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
        </span>
        LIVE
      </span>
    )
  if (connection === 'simulated')
    return (
      <span
        title="API unreachable — running the telemetry simulator in your browser"
        className="flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-[11px] font-semibold tracking-[.18em] text-amber"
      >
        <WifiOff size={12} /> SIMULATED
      </span>
    )
  return <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] tracking-[.18em] text-slate-400">CONNECTING…</span>
}

function Stat({ label, value, color, pulse }: { label: string; value: number; color?: string; pulse?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-lg px-2 py-1">
      <span className={`text-sm font-semibold tabular-nums ${pulse ? 'animate-pulse' : ''}`} style={{ color }}>
        {value}
      </span>
      <span className="text-[11px] text-slate-400">{label}</span>
    </div>
  )
}

function SearchBox() {
  const graph = useStore((s) => s.graph)
  const select = useStore((s) => s.select)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !graph) return []
    return graph.nodes.filter((nd) => nd.label.toLowerCase().includes(q) || nd.id.includes(q) || nd.tags.some((t) => t.includes(q))).slice(0, 7)
  }, [query, graph])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const choose = (id: string) => {
    select(id)
    setQuery('')
    setOpen(false)
    input.current?.blur()
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 focus-within:border-white/25">
        <Search size={14} className="text-slate-400" />
        <input
          ref={input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCursor(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setCursor((c) => Math.min(c + 1, results.length - 1))
            if (e.key === 'ArrowUp') setCursor((c) => Math.max(c - 1, 0))
            if (e.key === 'Enter' && results[cursor]) choose(results[cursor].id)
            if (e.key === 'Escape') input.current?.blur()
          }}
          placeholder="Search nodes…"
          aria-label="Search nodes"
          className="w-28 bg-transparent text-sm text-ink placeholder:text-slate-500 focus:outline-none sm:w-44"
        />
        <kbd className="hidden rounded border border-white/15 px-1.5 text-[10px] text-slate-400 sm:block">/</kbd>
      </div>
      {open && results.length > 0 && (
        <ul className="glass absolute right-0 mt-2 w-72 overflow-hidden rounded-xl py-1" role="listbox">
          {results.map((nd, i) => {
            const Icon = TYPE_ICONS[nd.type]
            return (
              <li key={nd.id}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(nd.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${i === cursor ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <Icon size={14} className="text-slate-300" />
                  <span className="flex-1 truncate">{nd.label}</span>
                  <span className="text-[11px] text-slate-500">{TYPE_LABELS[nd.type]}</span>
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[nd.status] }} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function TopBar() {
  const graph = useStore((s) => s.graph)
  const counts = useMemo(() => {
    const c = { active: 0, warning: 0, critical: 0 }
    graph?.nodes.forEach((nd) => c[nd.status]++)
    return c
  }, [graph])

  return (
    <header className="glass pointer-events-auto fixed inset-x-4 top-4 z-30 flex h-14 items-center gap-4 rounded-2xl px-4">
      <div className="flex items-center gap-3">
        <div className="relative h-8 w-8">
          <div className="logo-glyph absolute inset-1 rotate-45 rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_24px_rgba(139,92,246,.7)]" />
          <div className="absolute inset-[11px] rounded-full bg-[#05060f]" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-[.22em]">LUMORA AI</div>
          <div className="hidden text-[11px] text-slate-400 sm:block">Data Constellation</div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ConnectionPill />
        <div className="hidden items-center md:flex">
          <Stat label="nodes" value={graph?.nodes.length ?? 0} />
          <Stat label="links" value={graph?.edges.length ?? 0} />
          <Stat label="warning" value={counts.warning} color={STATUS_COLORS.warning} />
          <Stat label="critical" value={counts.critical} color={STATUS_COLORS.critical} pulse={counts.critical > 0} />
        </div>
        <SearchBox />
      </div>
    </header>
  )
}
