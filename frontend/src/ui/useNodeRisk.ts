import { useMemo } from 'react'
import type { GraphNode } from '@shared/graph.ts'
import { computeRisk, dependentsOf } from '../lib/risk.ts'
import type { Risk } from '../lib/risk.ts'
import { useStore } from '../store.ts'

export function useNodeRisk(node: GraphNode | null | undefined): Risk | null {
  const history = useStore((s) => (node ? s.history[node.id] : undefined))
  const graph = useStore((s) => s.graph)
  return useMemo(() => (node && graph ? computeRisk(node, history ?? [], dependentsOf(graph, node.id)) : null), [node, history, graph])
}
