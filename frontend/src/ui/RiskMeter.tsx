import type { GraphNode } from '@shared/graph.ts'
import { RISK_LEVELS } from '../lib/risk.ts'
import type { Risk } from '../lib/risk.ts'
import { useNodeRisk } from './useNodeRisk.ts'

const ARC = 'M8 38 A30 30 0 0 1 68 38'

export function RiskGauge({ risk }: { risk: Risk }) {
  const { color, label } = RISK_LEVELS[risk.level]
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-3 py-1.5"
      title="Risk blends how close metrics are to their thresholds, whether they are rising, and how many services depend on this node"
    >
      <svg width="76" height="44" viewBox="0 0 76 44" role="img" aria-label={`Risk ${risk.score} of 100, ${label}`}>
        <path d={ARC} fill="none" stroke="rgb(255 255 255 / .1)" strokeWidth="7" strokeLinecap="round" />
        <path
          d={ARC}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${Math.max(1, risk.score)} 100`}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray .6s, stroke .6s' }}
        />
        <text x="38" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">
          {risk.score}
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="micro-label">Risk</span>
          <span className="text-sm font-semibold" style={{ color }}>
            {label}
          </span>
        </div>
        <div className="truncate text-[11px] text-slate-400">{risk.reason}</div>
      </div>
    </div>
  )
}

export function RiskBadge({ node }: { node: GraphNode }) {
  const risk = useNodeRisk(node)
  if (!risk) return null
  const { color, label } = RISK_LEVELS[risk.level]
  return (
    <span
      title={risk.reason}
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color, background: `${color}1a`, border: `1px solid ${color}40` }}
    >
      Risk {risk.score} · {label}
    </span>
  )
}
