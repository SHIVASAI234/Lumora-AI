import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { useStore, useVisibleIds } from '../store.ts'
import { Edges } from './Edges.tsx'
import { FlowParticles } from './FlowParticles.tsx'
import { scatterBodies, stepPhysics, syncBodies } from './layout.ts'
import { NodeMesh } from './NodeMesh.tsx'

export function Constellation() {
  const graph = useStore((s) => s.graph)
  const selectedId = useStore((s) => s.selectedId)
  const hoveredId = useStore((s) => s.hoveredId)
  const scatterNonce = useStore((s) => s.scatterNonce)
  const showFlow = useStore((s) => s.showFlow)
  const visible = useVisibleIds()

  useEffect(() => {
    if (scatterNonce > 0) scatterBodies()
  }, [scatterNonce])

  const neighbours = useMemo(() => {
    const focus = selectedId ?? hoveredId
    const set = new Set<string>()
    if (!graph || !focus) return set
    set.add(focus)
    for (const e of graph.edges) {
      if (e.source === focus) set.add(e.target)
      if (e.target === focus) set.add(e.source)
    }
    return set
  }, [graph, selectedId, hoveredId])

  useFrame((_, dt) => {
    const s = useStore.getState()
    if (s.physics && s.graph) stepPhysics(s.graph, dt, s.gravity)
  }, -1)

  if (!graph) return null
  syncBodies(graph)
  const dimOthers = !!selectedId

  return (
    <group name="constellation">
      <group name="nodes">
        {graph.nodes.map((node) => (
          <NodeMesh
            key={node.id}
            node={node}
            visible={visible.has(node.id)}
            dimmed={dimOthers && !neighbours.has(node.id)}
          />
        ))}
      </group>
      <Edges graph={graph} visible={visible} focusId={selectedId ?? hoveredId} />
      {showFlow && <FlowParticles graph={graph} visible={visible} focusId={selectedId} />}
    </group>
  )
}
