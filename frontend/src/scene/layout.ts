import { Vector3 } from 'three'
import type { GraphSnapshot } from '@shared/graph.ts'

export interface Body {
  p: Vector3
  v: Vector3
  cluster: string
}

/** Node positions live outside React so the physics loop can mutate them every frame without re-rendering. */
export const bodies = new Map<string, Body>()

const REPULSION = 70
const SPRING = 0.035
const REST_LENGTH = 7
const DAMPING = 0.86
const MAX_SPEED = 1.6

const _d = new Vector3()
const _f = new Vector3()

export function syncBodies(graph: GraphSnapshot | null) {
  if (!graph) return
  const ids = new Set<string>()
  for (const node of graph.nodes) {
    ids.add(node.id)
    if (!bodies.has(node.id)) {
      bodies.set(node.id, { p: new Vector3(...node.position), v: new Vector3(), cluster: node.cluster })
    }
  }
  for (const id of bodies.keys()) if (!ids.has(id)) bodies.delete(id)
}

export function scatterBodies(radius = 45) {
  for (const b of bodies.values()) {
    b.p.set((Math.random() - 0.5) * radius * 2, (Math.random() - 0.5) * radius, (Math.random() - 0.5) * radius * 2)
    b.v.set(0, 0, 0)
  }
}

export function stepPhysics(graph: GraphSnapshot, dt: number, gravity: number) {
  const step = Math.min(dt * 60, 2)
  const list = graph.nodes.map((nd) => bodies.get(nd.id)).filter((b): b is Body => !!b)
  const forces = list.map(() => new Vector3())
  const index = new Map(graph.nodes.map((nd, i) => [nd.id, i]))

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      _d.subVectors(list[i].p, list[j].p)
      const dist2 = Math.max(_d.lengthSq(), 0.25)
      _d.normalize().multiplyScalar(REPULSION / dist2)
      forces[i].add(_d)
      forces[j].sub(_d)
    }
  }

  for (const e of graph.edges) {
    const i = index.get(e.source)
    const j = index.get(e.target)
    if (i === undefined || j === undefined) continue
    _d.subVectors(list[j].p, list[i].p)
    const len = _d.length() || 0.001
    _d.multiplyScalar((SPRING * (len - REST_LENGTH)) / len)
    forces[i].add(_d)
    forces[j].sub(_d)
  }

  const g = gravity / 100
  const centers = new Map(graph.clusters.map((c) => [c.id, new Vector3(...c.center)]))
  for (let i = 0; i < list.length; i++) {
    const b = list[i]
    const center = centers.get(b.cluster)
    if (center) forces[i].add(_f.subVectors(center, b.p).multiplyScalar(0.012 * g))
    forces[i].addScaledVector(b.p, -0.0015 * (0.3 + g))
    b.v.addScaledVector(forces[i], step).multiplyScalar(DAMPING)
    if (b.v.length() > MAX_SPEED) b.v.setLength(MAX_SPEED)
    b.p.addScaledVector(b.v, step)
  }
}
