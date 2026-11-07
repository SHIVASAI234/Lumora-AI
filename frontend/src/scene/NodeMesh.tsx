import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { memo, useMemo, useRef, useState } from 'react'
import { AdditiveBlending, Color, DoubleSide } from 'three'
import type { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import type { GraphNode, NodeType } from '@shared/graph.ts'
import { NODE_SIZE, STATUS_COLORS } from '../lib/themes.ts'
import { prefersReducedMotion, useStore } from '../store.ts'
import { bodies } from './layout.ts'

const hashPhase = (id: string) => ([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 628) / 100

const PULSE_SPEED = { active: 1.4, warning: 2.6, critical: 4.2 }
const GLOW = { active: 1.8, warning: 2.4, critical: 3.2 }
const SHOCK_RINGS = 2

function CoreGeometry({ type, size }: { type: NodeType; size: number }) {
  switch (type) {
    case 'gateway':
      return <octahedronGeometry args={[size * 1.15, 0]} />
    case 'database':
      return <dodecahedronGeometry args={[size, 0]} />
    case 'ai':
      return <icosahedronGeometry args={[size, 0]} />
    case 'queue':
      return <torusGeometry args={[size * 0.75, size * 0.32, 16, 40]} />
    case 'external':
      return <tetrahedronGeometry args={[size * 1.2, 0]} />
    default:
      return <sphereGeometry args={[size, 32, 32]} />
  }
}

interface Props {
  node: GraphNode
  visible: boolean
  dimmed: boolean
}

export const NodeMesh = memo(function NodeMesh({ node, visible, dimmed }: Props) {
  const group = useRef<Group>(null)
  const core = useRef<Mesh>(null)
  const halo = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  const hovered = useStore((s) => s.hoveredId === node.id)
  const selected = useStore((s) => s.selectedId === node.id)
  const hover = useStore((s) => s.hover)
  const select = useStore((s) => s.select)
  const threatFx = useStore((s) => s.threatFx)
  const shocks = useRef<(Mesh | null)[]>([])

  const size = NODE_SIZE[node.type]
  const phase = useMemo(() => hashPhase(node.id), [node.id])
  const target = useMemo(() => new Color(STATUS_COLORS[node.status]), [node.status])
  const [initialColor] = useState(() => STATUS_COLORS[node.status])

  useFrame((state, dt) => {
    const g = group.current
    const body = bodies.get(node.id)
    if (!g || !body) return
    g.position.copy(body.p)

    const t = state.clock.elapsedTime
    const k = 1 - Math.pow(0.001, dt)
    const active = hovered || selected
    const s = g.scale.x + ((active ? 1.35 : 1) - g.scale.x) * k
    g.scale.setScalar(s)

    const coreMat = core.current!.material as MeshStandardMaterial
    coreMat.emissive.lerp(target, k * 0.6)
    coreMat.color.lerp(target, k * 0.6)
    const pulse = Math.sin(t * PULSE_SPEED[node.status] + phase)
    coreMat.emissiveIntensity = (GLOW[node.status] + pulse * 0.4) * (dimmed ? 0.25 : 1) * (active ? 1.4 : 1)
    coreMat.opacity += ((dimmed ? 0.35 : 1) - coreMat.opacity) * k
    core.current!.rotation.y += dt * 0.35
    core.current!.rotation.x += dt * 0.15

    const haloMat = halo.current!.material as MeshBasicMaterial
    haloMat.color.lerp(target, k * 0.6)
    haloMat.opacity = (dimmed ? 0.03 : 0.11 + (pulse + 1) * 0.05) * (node.status === 'critical' ? 1.6 : 1)
    halo.current!.scale.setScalar(size * (2 + pulse * 0.25) * (selected ? 1.35 : 1))

    const r = ring.current!
    r.visible = active
    r.quaternion.copy(state.camera.quaternion)
    r.rotateZ(t * (selected ? 1.6 : 0.6))

    const shock = threatFx && node.status === 'critical' && !dimmed
    shocks.current.forEach((m, i) => {
      if (!m) return
      m.visible = shock
      if (!shock) return
      const ph = prefersReducedMotion ? 0.3 + i * 0.3 : (t * 0.55 + i / SHOCK_RINGS + phase) % 1
      m.scale.setScalar(size * (1.6 + ph * 4.5))
      ;(m.material as MeshBasicMaterial).opacity = (1 - ph) ** 2 * 0.75
      m.quaternion.copy(state.camera.quaternion)
    })
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hover(node.id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (useStore.getState().hoveredId === node.id) hover(null)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    select(node.id)
  }

  return (
    <group ref={group} visible={visible} name={`node:${node.id}`}>
      <mesh ref={core} onPointerOver={visible ? onOver : undefined} onPointerOut={visible ? onOut : undefined} onClick={visible ? onClick : undefined}>
        <CoreGeometry type={node.type} size={size} />
        <meshStandardMaterial
          color={initialColor}
          emissive={initialColor}
          emissiveIntensity={2}
          toneMapped={false}
          roughness={0.35}
          metalness={0.2}
          transparent
          flatShading={node.type !== 'service' && node.type !== 'cache'}
        />
      </mesh>
      <mesh ref={halo} raycast={() => null}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={initialColor} transparent opacity={0.12} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ring} raycast={() => null} visible={false}>
        <ringGeometry args={[size * 2.1, size * 2.3, 64, 1, 0, Math.PI * 1.6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} side={DoubleSide} toneMapped={false} depthWrite={false} />
      </mesh>
      {Array.from({ length: SHOCK_RINGS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            shocks.current[i] = m
          }}
          raycast={() => null}
          visible={false}
        >
          <ringGeometry args={[0.92, 1, 64]} />
          <meshBasicMaterial color={STATUS_COLORS.critical} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
})
