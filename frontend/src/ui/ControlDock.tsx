import { Eye, Magnet, Orbit, Palette, PanelLeftClose, PanelLeftOpen, RefreshCw, Rotate3d, Shapes, Shuffle, Siren, Sparkles, Tag } from 'lucide-react'
import type { ReactNode } from 'react'
import { NODE_TYPES, STATUSES } from '@shared/graph.ts'
import { timeAgo } from '../lib/format.ts'
import { resync } from '../lib/live.ts'
import { STATUS_COLORS, STATUS_LABELS, THEMES, TYPE_COLORS, TYPE_LABELS } from '../lib/themes.ts'
import type { ThemeId } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import type { IconSet } from '../store.ts'
import { HERO_ICONS, TYPE_ICONS, useTypeIcons } from './icons.ts'
import { useNow } from './useNow.ts'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/5 px-4 py-4 first:border-t-0">
      <h3 className="micro-label mb-3">{title}</h3>
      {children}
    </section>
  )
}

function Chip({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-200 ${
        active ? 'border-white/20 bg-white/10 text-ink' : 'border-white/5 bg-transparent text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function Switch({ checked, onChange, label, icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; icon: ReactNode }) {
  const accent = THEMES[useStore((s) => s.theme)].accent
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-sm text-slate-200">
      <span className="flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative h-5 w-9 rounded-full transition-colors duration-300"
        style={{ background: checked ? accent : 'rgba(255,255,255,.12)', boxShadow: checked ? `0 0 12px ${accent}` : undefined }}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-300 ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

export function ControlDock() {
  const s = useStore()
  const theme = THEMES[s.theme]
  const Icons = useTypeIcons()
  useNow(5000)

  const counts = { active: 0, warning: 0, critical: 0 }
  const typeCounts: Partial<Record<string, number>> = {}
  s.graph?.nodes.forEach((nd) => {
    counts[nd.status]++
    typeCounts[nd.type] = (typeCounts[nd.type] ?? 0) + 1
  })

  if (s.dockCollapsed) {
    return (
      <aside className="glass pointer-events-auto fixed left-4 top-24 z-20 flex flex-col items-center gap-1 rounded-2xl p-2">
        <RailButton label="Expand controls" onClick={() => s.setDockCollapsed(false)}>
          <PanelLeftOpen size={18} />
        </RailButton>
        <RailButton label="Toggle physics" active={s.physics} onClick={() => s.setPhysics(!s.physics)}>
          <Orbit size={18} />
        </RailButton>
        <RailButton label="Toggle labels" active={s.showLabels} onClick={() => s.setShowLabels(!s.showLabels)}>
          <Tag size={18} />
        </RailButton>
        <RailButton label="Auto-rotate" active={s.autoRotate} onClick={() => s.setAutoRotate(!s.autoRotate)}>
          <Rotate3d size={18} />
        </RailButton>
        <RailButton label="Re-sync data" onClick={() => void resync()}>
          <RefreshCw size={18} className={s.syncing ? 'animate-spin' : ''} />
        </RailButton>
      </aside>
    )
  }

  return (
    <aside className="glass scrollbar-thin pointer-events-auto fixed bottom-4 left-4 top-24 z-20 flex w-72 flex-col overflow-y-auto rounded-2xl transition-all duration-300 ease-out-expo">
      <div className="flex items-center justify-between px-4 pt-4">
        <span className="text-sm font-semibold">Control Dock</span>
        <button aria-label="Collapse controls" onClick={() => s.setDockCollapsed(true)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
          <PanelLeftClose size={16} />
        </button>
      </div>

      <Section title="Node types">
        <div className="flex flex-wrap gap-1.5">
          {NODE_TYPES.map((t) => {
            const Icon = Icons[t]
            return (
              <Chip key={t} active={s.typeFilter[t]} onClick={() => s.toggleType(t)} label={`Toggle ${TYPE_LABELS[t]} nodes`}>
                <Icon size={14} style={{ color: s.typeFilter[t] ? TYPE_COLORS[t] : undefined }} />
                {TYPE_LABELS[t]}
                <span className="tabular-nums text-slate-400">{typeCounts[t] ?? 0}</span>
              </Chip>
            )
          })}
        </div>
      </Section>

      <Section title="Status">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((st) => (
            <Chip key={st} active={s.statusFilter[st]} onClick={() => s.toggleStatus(st)} label={`Toggle ${STATUS_LABELS[st]} nodes`}>
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[st], boxShadow: `0 0 8px ${STATUS_COLORS[st]}` }} />
              {STATUS_LABELS[st]}
              <span className="tabular-nums text-slate-400">{counts[st]}</span>
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Physics">
        <Switch checked={s.physics} onChange={s.setPhysics} label="Particle physics" icon={<Orbit size={15} />} />
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-sm text-slate-200">
            <span className="flex items-center gap-2">
              <Magnet size={15} className="text-slate-400" /> Gravity
            </span>
            <span className="tabular-nums text-xs text-slate-400">{s.gravity}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={s.gravity}
            onChange={(e) => s.setGravity(Number(e.target.value))}
            aria-label="Gravity"
            className="w-full"
            style={{ accentColor: theme.accent }}
          />
        </div>
        <button
          onClick={s.scatter}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-1.5 text-xs text-slate-300 hover:border-white/20 hover:bg-white/5"
        >
          <Shuffle size={13} /> Scatter &amp; re-settle
        </button>
      </Section>

      <Section title="View">
        <Switch checked={s.showLabels} onChange={s.setShowLabels} label="Labels" icon={<Tag size={15} />} />
        <Switch checked={s.autoRotate} onChange={s.setAutoRotate} label="Auto-rotate" icon={<Rotate3d size={15} />} />
        <Switch checked={s.showFlow} onChange={s.setShowFlow} label="Flow particles" icon={<Sparkles size={15} />} />
        <Switch checked={s.threatFx} onChange={s.setThreatFx} label="Threat FX" icon={<Siren size={15} />} />
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-200">
          <Shapes size={15} className="text-slate-400" /> Icons
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1" role="radiogroup" aria-label="Icon style">
          {(['standard', 'hero'] as IconSet[]).map((id) => {
            const Preview = (id === 'hero' ? HERO_ICONS : TYPE_ICONS).gateway
            return (
              <button
                key={id}
                role="radio"
                aria-checked={s.iconSet === id}
                onClick={() => s.setIconSet(id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-all ${s.iconSet === id ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Preview size={13} style={{ color: TYPE_COLORS.gateway }} />
                {id === 'hero' ? 'Hero' : 'Standard'}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-200">
          <Palette size={15} className="text-slate-400" /> Theme
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1" role="radiogroup" aria-label="Theme">
          {(Object.keys(THEMES) as ThemeId[]).map((id) => (
            <button
              key={id}
              role="radio"
              aria-checked={s.theme === id}
              onClick={() => s.setTheme(id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs transition-all ${s.theme === id ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `linear-gradient(135deg, ${THEMES[id].edgeFrom}, ${THEMES[id].edgeTo})` }} />
              {THEMES[id].label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Data">
        <button
          onClick={() => void resync()}
          disabled={s.syncing}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${theme.edgeFrom}, ${theme.edgeTo})`, boxShadow: `0 0 24px ${theme.accent}55` }}
        >
          <RefreshCw size={15} className={s.syncing ? 'animate-spin' : ''} />
          {s.syncing ? 'Re-syncing…' : 'Re-sync data'}
        </button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Eye size={11} /> Last sync {s.lastSyncAt ? timeAgo(s.lastSyncAt) : '—'}
        </p>
      </Section>
    </aside>
  )
}

function RailButton({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl p-2.5 transition-colors ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
      {children}
    </button>
  )
}
