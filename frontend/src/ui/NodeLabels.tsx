import { useCallback } from 'react'
import { labelElements } from '../scene/labels.ts'
import { useStore, useVisibleIds } from '../store.ts'

function Label({ id, label, active, dimmed }: { id: string; label: string; active: boolean; dimmed: boolean }) {
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) labelElements.set(id, el)
      else labelElements.delete(id)
    },
    [id],
  )
  return (
    <div
      ref={ref}
      className="node-label absolute left-0 top-0"
      data-active={active}
      style={{ visibility: 'hidden', opacity: active ? 1 : `calc(var(--depth, 1) * ${dimmed ? 0.3 : 1})` }}
    >
      {label}
    </div>
  )
}

export function NodeLabels() {
  const graph = useStore((s) => s.graph)
  const showLabels = useStore((s) => s.showLabels)
  const selectedId = useStore((s) => s.selectedId)
  const hoveredId = useStore((s) => s.hoveredId)
  const visible = useVisibleIds()
  if (!graph || !showLabels) return null

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
            id={nd.id}
            label={nd.label}
            active={nd.id === selectedId || nd.id === hoveredId}
            dimmed={!!selectedId && !neighbours.has(nd.id)}
          />
        ))}
    </div>
  )
}
