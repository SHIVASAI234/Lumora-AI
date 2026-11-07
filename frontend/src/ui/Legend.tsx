import { STATUSES } from '@shared/graph.ts'
import { STATUS_COLORS, STATUS_LABELS } from '../lib/themes.ts'
import { useStore } from '../store.ts'

export function Legend() {
  const collapsed = useStore((s) => s.dockCollapsed)
  return (
    <div
      className={`glass pointer-events-auto fixed bottom-4 z-10 hidden rounded-xl px-4 py-2.5 text-xs transition-all duration-300 sm:block ${collapsed ? 'left-24' : 'left-80'}`}
    >
      <div className="flex items-center gap-4">
        {STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s], boxShadow: `0 0 8px ${STATUS_COLORS[s]}` }} />
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">Drag to orbit · Scroll to zoom · Click a star to inspect</div>
    </div>
  )
}
