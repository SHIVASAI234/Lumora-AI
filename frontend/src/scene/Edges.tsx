import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three'
import type { GraphSnapshot } from '@shared/graph.ts'
import { STATUS_COLORS, THEMES } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import { bodies } from './layout.ts'

const vertexShader = /* glsl */ `
  attribute float aProgress;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSpeed;
  varying float vProgress;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpeed;
  void main() {
    vProgress = aProgress;
    vColor = aColor;
    vAlpha = aAlpha;
    vSpeed = aSpeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  varying float vProgress;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSpeed;
  void main() {
    if (vAlpha < 0.01) discard;
    float w = fract(vProgress * 1.5 - uTime * vSpeed);
    float pulse = smoothstep(0.7, 1.0, w) * step(w, 0.995);
    float intensity = 0.55 + pulse * 3.0;
    gl_FragColor = vec4(vColor * intensity, (0.22 + pulse * 0.78) * vAlpha);
  }
`

export function Edges({ graph, visible, focusId }: { graph: GraphSnapshot; visible: Set<string>; focusId: string | null }) {
  const themeId = useStore((s) => s.theme)
  const material = useRef<ShaderMaterial>(null)
  const count = graph.edges.length

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3))
    geo.setAttribute('aColor', new BufferAttribute(new Float32Array(count * 6), 3))
    geo.setAttribute('aAlpha', new BufferAttribute(new Float32Array(count * 2), 1))
    geo.setAttribute('aSpeed', new BufferAttribute(new Float32Array(count * 2), 1))
    const progress = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) progress[i * 2 + 1] = 1
    geo.setAttribute('aProgress', new BufferAttribute(progress, 1))
    return geo
  }, [count])

  useEffect(() => () => geometry.dispose(), [geometry])

  useEffect(() => {
    const theme = THEMES[themeId]
    const from = new Color(theme.edgeFrom)
    const to = new Color(theme.edgeTo)
    const colors = geometry.getAttribute('aColor') as BufferAttribute
    const alpha = geometry.getAttribute('aAlpha') as BufferAttribute
    const speed = geometry.getAttribute('aSpeed') as BufferAttribute
    graph.edges.forEach((e, i) => {
      const status = e.status !== 'active' ? new Color(STATUS_COLORS[e.status]) : null
      const a = status ?? from
      const b = status ?? to
      colors.setXYZ(i * 2, a.r, a.g, a.b)
      colors.setXYZ(i * 2 + 1, b.r, b.g, b.b)
      const shown = visible.has(e.source) && visible.has(e.target)
      const connected = !focusId || e.source === focusId || e.target === focusId
      const value = shown ? (connected ? (focusId ? 1 : 0.75) : 0.12) : 0
      alpha.setX(i * 2, value)
      alpha.setX(i * 2 + 1, value)
      const sp = 0.25 + Math.min(Math.log10(Math.max(e.throughput, 1)) / 4, 1) * 0.55
      speed.setX(i * 2, sp)
      speed.setX(i * 2 + 1, sp)
    })
    colors.needsUpdate = alpha.needsUpdate = speed.needsUpdate = true
  }, [graph, visible, focusId, themeId, geometry])

  useFrame((state) => {
    const pos = geometry.getAttribute('position') as BufferAttribute
    graph.edges.forEach((e, i) => {
      const s = bodies.get(e.source)?.p
      const t = bodies.get(e.target)?.p
      if (!s || !t) return
      pos.setXYZ(i * 2, s.x, s.y, s.z)
      pos.setXYZ(i * 2 + 1, t.x, t.y, t.z)
    })
    pos.needsUpdate = true
    geometry.computeBoundingSphere()
    if (material.current) material.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  return (
    <lineSegments geometry={geometry} raycast={() => null} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </lineSegments>
  )
}
