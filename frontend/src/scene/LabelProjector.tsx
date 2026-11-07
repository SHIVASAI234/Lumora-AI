import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { bodies } from './layout.ts'
import { labelElements } from './labels.ts'

const _v = new Vector3()

export function LabelProjector() {
  useFrame(({ camera, size }) => {
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
      const offset = Math.min(60, 380 / dist)
      const x = (_v.x * 0.5 + 0.5) * size.width
      const y = (-_v.y * 0.5 + 0.5) * size.height - offset - 10
      el.style.visibility = 'visible'
      el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      el.style.setProperty('--depth', Math.max(0.65, Math.min(1, 1.6 - dist / 150)).toFixed(2))
    }
  })
  return null
}
