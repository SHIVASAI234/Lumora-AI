import { Bell, BellRing, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { STATUS_COLORS } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import type { FeedEvent } from '../store.ts'
import { AlertCard } from './AlertCard.tsx'
import { useNow } from './useNow.ts'

type Filter = 'all' | 'critical' | 'warning' | 'recovered'

const FILTERS: { id: Filter; label: string; match: (e: FeedEvent) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'critical', label: 'Critical', match: (e) => e.to === 'critical' },
  { id: 'warning', label: 'Warning', match: (e) => e.to === 'warning' },
  { id: 'recovered', label: 'Recovered', match: (e) => e.to === 'active' },
]

export function NotificationBell() {
  const events = useStore((s) => s.events)
  const lastSeenAt = useStore((s) => s.lastSeenAt)
  const graph = useStore((s) => s.graph)
  const markAllRead = useStore((s) => s.markAllRead)
  const inspectEvent = useStore((s) => s.inspectEvent)
  const openLogs = useStore((s) => s.openLogs)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [readAt, setReadAt] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  useNow(open ? 1000 : 60_000)

  const unread = events.filter((e) => e.at > lastSeenAt)
  const hot = unread.some((e) => e.to === 'critical')

  useEffect(() => {
    if (open && unread.length) markAllRead()
  }, [open, unread.length, markAllRead])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const nodes = new Map(graph?.nodes.map((nd) => [nd.id, nd]))
  const clusters = new Map(graph?.clusters.map((c) => [c.id, c.label]))
  const active = FILTERS.find((f) => f.id === filter)!
  const visible = events.filter(active.match)

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={unread.length ? `Notifications, ${unread.length} unread` : 'Notifications'}
        aria-expanded={open}
        className={`relative rounded-lg p-2 transition-colors hover:bg-white/10 ${open ? 'bg-white/10 text-white' : 'text-slate-300'}`}
      >
        {hot ? <BellRing size={17} className="bell-ring" style={{ color: STATUS_COLORS.critical }} /> : <Bell size={17} />}
        {unread.length > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: hot ? STATUS_COLORS.critical : STATUS_COLORS.warning, boxShadow: `0 0 10px ${hot ? STATUS_COLORS.critical : STATUS_COLORS.warning}` }}
          >
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="glass toast-in absolute right-0 top-full mt-3 flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl"
          style={{ background: 'rgb(9 10 24 / 0.94)' }}
        >
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <span className="text-sm font-semibold">Notifications</span>
            <button
              onClick={() => {
                setReadAt(Date.now())
                markAllRead()
              }}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          </div>
          <div className="flex gap-1 px-3 pb-2" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${filter === f.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {f.label}
                <span className="tabular-nums text-slate-500">{events.filter(f.match).length}</span>
              </button>
            ))}
          </div>
          <ul className="scrollbar-thin max-h-[min(65vh,520px)] space-y-2 overflow-y-auto px-3 pb-3">
            {visible.length ? (
              visible.map((e) => (
                <AlertCard
                  key={e.key}
                  event={e}
                  node={nodes.get(e.id)}
                  cluster={clusters.get(nodes.get(e.id)?.cluster ?? '')}
                  unread={e.at > readAt}
                  onInspect={() => {
                    inspectEvent(e)
                    setOpen(false)
                  }}
                  onLogs={() => {
                    inspectEvent(e)
                    openLogs(e.id, 'logs')
                    setOpen(false)
                  }}
                />
              ))
            ) : (
              <li className="py-8 text-center text-xs text-slate-500">No {filter === 'all' ? '' : `${active.label.toLowerCase()} `}alerts yet. All clear.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
