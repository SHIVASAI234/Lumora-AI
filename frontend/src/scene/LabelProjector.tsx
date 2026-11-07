import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import { bodies } from './layout.ts'
import { labelElements } from './labels.ts'

const _v = new Vector3()

export function LabelProjector() {
  useFrame(({ camera, size }) => {
    const focal = size.height / (2 * Math.tan((((camera as PerspectiveCamera).fov ?? 50) * Math.PI) / 360))
    for (const [id, el] of labelElements) {
      const body = bodies.get(id)
      if (!body) continue
      _v.copy(body.p)
      const dist = _v.distanceTo(camera.position)
      _v.project(camera)
      if (_v.z > 1 || dist > 200) {
        el.style.visibility = 'hidden'
        continue
      }
      const emblem = Math.max(22, Math.min(72, Number(el.dataset.size) * 2.6 * (focal / dist)))
      const lift = Math.max(Math.min(60, 380 / dist), el.dataset.hero === 'true' ? emblem / 2 : 0) + 10
      const x = (_v.x * 0.5 + 0.5) * size.width
      const y = (-_v.y * 0.5 + 0.5) * size.height
      el.style.visibility = 'visible'
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      el.style.setProperty('--lift', `${lift.toFixed(1)}px`)
      el.style.setProperty('--emblem', `${emblem.toFixed(1)}px`)
      el.style.setProperty('--depth', Math.max(0.65, Math.min(1, 1.6 - dist / 150)).toFixed(2))
    }
  })
  return null
}
