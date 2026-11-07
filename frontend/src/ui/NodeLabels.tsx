import { useCallback } from 'react'
import type { CSSProperties } from 'react'
import type { GraphNode } from '@shared/graph.ts'
import { NODE_SIZE, STATUS_COLORS, TYPE_COLORS } from '../lib/themes.ts'
import { labelElements } from '../scene/labels.ts'
import { useStore, useVisibleIds } from '../store.ts'
import { heroFor } from '../lib/heroes.ts'
import { HERO_GLYPHS } from './icons.ts'

interface Props {
  node: GraphNode
  active: boolean
  dimmed: boolean
  showText: boolean
  hero: boolean
}

function Label({ node, active, dimmed, showText, hero }: Props) {
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) labelElements.set(node.id, el)
      else labelElements.delete(node.id)
    },
    [node.id],
  )
  const Emblem = HERO_GLYPHS[heroFor(node).glyph]
  return (
    <div
      ref={ref}
      className="node-anchor"
      data-size={NODE_SIZE[node.type]}
      data-hero={hero}
      style={{ visibility: 'hidden', opacity: active ? 1 : `calc(var(--depth, 1) * ${dimmed ? 0.4 : 1})` }}
    >
      {hero && (
        <div
          className="node-emblem"
          data-active={active}
          style={{ '--status': STATUS_COLORS[node.status], color: TYPE_COLORS[node.type] } as CSSProperties}
        >
          <Emblem />
        </div>
      )}
      {showText && (
        <div className="node-label" data-active={active}>
          {node.label}
        </div>
      )}
    </div>
  )
}

export function NodeLabels() {
  const graph = useStore((s) => s.graph)
  const showLabels = useStore((s) => s.showLabels)
  const hero = useStore((s) => s.iconSet) === 'hero'
  const selectedId = useStore((s) => s.selectedId)
  const hoveredId = useStore((s) => s.hoveredId)
  const visible = useVisibleIds()
  if (!graph || (!showLabels && !hero)) return null

  const neighbours = new Set<string>()
  if (selectedId) {
    neighbours.add(selectedId)
    for (const e of graph.edges) {
      if (e.source === selectedId) neighbours.add(e.target)
      if (e.target === selectedId) neighbours.add(e.source)
    }
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      {graph.nodes
        .filter((nd) => visible.has(nd.id))
        .map((nd) => (
          <Label
            key={nd.id}
            node={nd}
            active={nd.id === selectedId || nd.id === hoveredId}
            dimmed={!!selectedId && !neighbours.has(nd.id)}
            showText={showLabels}
            hero={hero}
          />
        ))}
    </div>
  )
}
