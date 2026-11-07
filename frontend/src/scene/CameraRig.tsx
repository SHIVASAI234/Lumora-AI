import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useStore } from '../store.ts'
import { bodies } from './layout.ts'

const FOCUS_DISTANCE = 34
const OVERVIEW_DISTANCE = 82
const ORIGIN = new Vector3()

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const selectedId = useStore((s) => s.selectedId)
  const autoRotate = useStore((s) => s.autoRotate)
  const mode = useRef<'idle' | 'focus' | 'overview'>('idle')
  const dir = useRef(new Vector3())
  const goal = useRef(new Vector3())
  const prevSelected = useRef<string | null>(null)

  useEffect(() => {
    if (selectedId) mode.current = 'focus'
    else if (prevSelected.current) mode.current = 'overview'
    prevSelected.current = selectedId
  }, [selectedId])

  useFrame((_, dt) => {
    const ctrl = controls.current
    if (!ctrl) return
    const k = 1 - Math.pow(0.04, dt)

    if (selectedId) {
      const body = bodies.get(selectedId)
      if (!body) return
      ctrl.target.lerp(body.p, k)
      if (mode.current === 'focus') {
        dir.current.copy(camera.position).sub(ctrl.target).normalize()
        goal.current.copy(body.p).addScaledVector(dir.current, FOCUS_DISTANCE)
        camera.position.lerp(goal.current, k)
        if (camera.position.distanceTo(goal.current) < 0.4) mode.current = 'idle'
      }
    } else if (mode.current === 'overview') {
      ctrl.target.lerp(ORIGIN, k)
      const dist = camera.position.distanceTo(ctrl.target)
      if (dist < OVERVIEW_DISTANCE * 0.7) {
        dir.current.copy(camera.position).sub(ctrl.target).normalize()
        goal.current.copy(ctrl.target).addScaledVector(dir.current, OVERVIEW_DISTANCE)
        camera.position.lerp(goal.current, k * 0.6)
      }
      if (ctrl.target.length() < 0.2 && dist >= OVERVIEW_DISTANCE * 0.68) mode.current = 'idle'
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={8}
      maxDistance={160}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI - 0.2}
      autoRotate={autoRotate && !selectedId}
      autoRotateSpeed={0.35}
      onStart={() => {
        mode.current = 'idle'
      }}
    />
  )
}
