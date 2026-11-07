import { Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { THEMES } from '../lib/themes.ts'
import { useStore } from '../store.ts'
import { CameraRig } from './CameraRig.tsx'
import { Constellation } from './Constellation.tsx'
import { LabelProjector } from './LabelProjector.tsx'

export function Scene() {
  const theme = THEMES[useStore((s) => s.theme)]
  const select = useStore((s) => s.select)

  return (
    <div className="fixed inset-0 z-0 transition-[background] duration-700" style={{ background: theme.gradient }}>
      <Canvas
        camera={{ position: [0, 22, 82], fov: 50, near: 0.1, far: 800 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => select(null)}
      >
        <fog attach="fog" args={[theme.fog, 90, 260]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[50, 60, 40]} intensity={2200} color={theme.edgeTo} />
        <pointLight position={[-60, -30, -50]} intensity={1600} color={theme.edgeFrom} />
        <Stars radius={220} depth={90} count={4500} factor={5} saturation={0} fade speed={0.6} />
        <Constellation />
        <CameraRig />
        <LabelProjector />
        <EffectComposer>
          <Bloom mipmapBlur intensity={theme.bloom} luminanceThreshold={0.18} luminanceSmoothing={0.25} />
          <Vignette darkness={0.65} offset={0.25} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
