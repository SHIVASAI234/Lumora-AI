import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import { mulberry32 } from '@shared/graph.ts'
import type { GraphSnapshot } from '@shared/graph.ts'
import { STATUS_COLORS, THEMES } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import { bodies } from './layout.ts'

const vertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    if (vAlpha < 0.01) discard;
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * 2.2, a * vAlpha);
  }
`

const PER_EDGE = 3

export function FlowParticles({ graph, visible, focusId }: { graph: GraphSnapshot; visible: Set<string>; focusId: string | null }) {
  const themeId = useStore((s) => s.theme)
  const count = graph.edges.length * PER_EDGE

  const { geometry, offsets, speeds } = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
    geo.setAttribute('aColor', new BufferAttribute(new Float32Array(count * 3), 3))
    geo.setAttribute('aAlpha', new BufferAttribute(new Float32Array(count), 1))
    const sizes = new Float32Array(count)
    const offs = new Float32Array(count)
    const rand = mulberry32(count)
    for (let i = 0; i < count; i++) {
      sizes[i] = 0.6 + rand() * 0.5
      offs[i] = (i % PER_EDGE) / PER_EDGE + rand() * 0.1
    }
    geo.setAttribute('aSize', new BufferAttribute(sizes, 1))
    return { geometry: geo, offsets: offs, speeds: new Float32Array(count) }
  }, [count])

  useEffect(() => () => geometry.dispose(), [geometry])

  useEffect(() => {
    const theme = THEMES[themeId]
    const base = new Color(theme.edgeTo)
    const colors = geometry.getAttribute('aColor') as BufferAttribute
    const alpha = geometry.getAttribute('aAlpha') as BufferAttribute
    graph.edges.forEach((e, ei) => {
      const c = e.status === 'active' ? base : new Color(STATUS_COLORS[e.status])
      const shown = visible.has(e.source) && visible.has(e.target)
      const connected = !focusId || e.source === focusId || e.target === focusId
      const active = Math.min(PER_EDGE, 1 + Math.floor(Math.log10(Math.max(e.throughput, 1)) - 1))
      for (let k = 0; k < PER_EDGE; k++) {
        const i = ei * PER_EDGE + k
        colors.setXYZ(i, c.r, c.g, c.b)
        alpha.setX(i, shown && k < active ? (connected ? 0.9 : 0.1) : 0)
        speeds[i] = 0.08 + Math.min(Math.log10(Math.max(e.throughput, 1)) / 4, 1) * 0.22
      }
    })
    colors.needsUpdate = alpha.needsUpdate = true
  }, [graph, visible, focusId, themeId, geometry, speeds])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const pos = geometry.getAttribute('position') as BufferAttribute
    graph.edges.forEach((e, ei) => {
      const s = bodies.get(e.source)?.p
      const d = bodies.get(e.target)?.p
      if (!s || !d) return
      for (let k = 0; k < PER_EDGE; k++) {
        const i = ei * PER_EDGE + k
        const f = (offsets[i] + t * speeds[i]) % 1
        pos.setXYZ(i, s.x + (d.x - s.x) * f, s.y + (d.y - s.y) * f, s.z + (d.z - s.z) * f)
      }
    })
    pos.needsUpdate = true
  })

  return (
    <points geometry={geometry} raycast={() => null} frustumCulled={false}>
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={AdditiveBlending} />
    </points>
  )
}
