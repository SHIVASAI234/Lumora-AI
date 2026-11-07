import { useEffect } from 'react'
import { resync, startLive } from './lib/live.ts'
import { Scene } from './scene/Scene.tsx'
import { useStore } from './store.ts'
import { ControlDock } from './ui/ControlDock.tsx'
import { HoverTooltip } from './ui/HoverTooltip.tsx'
import { InspectorDrawer } from './ui/InspectorDrawer.tsx'
import { LogViewer } from './ui/LogViewer.tsx'
import { Legend } from './ui/Legend.tsx'
import { NodeLabels } from './ui/NodeLabels.tsx'
import { ThreatOverlay } from './ui/ThreatOverlay.tsx'
import { TopBar } from './ui/TopBar.tsx'
import { useAlarm } from './ui/useAlarm.ts'

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return
      const s = useStore.getState()
      switch (e.key.toLowerCase()) {
        case 'escape':
          s.select(null)
          break
        case 'r':
          void resync()
          break
        case 'p':
          s.setPhysics(!s.physics)
          break
        case 'l':
          s.setShowLabels(!s.showLabels)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  useEffect(() => startLive(), [])
  useShortcuts()
  useAlarm()

  return (
    <>
      <Scene />
      <ThreatOverlay />
      <NodeLabels />
      <div className="pointer-events-none fixed inset-0 z-10">
        <TopBar />
        <ControlDock />
        <InspectorDrawer />
        <Legend />
        <HoverTooltip />
        <LogViewer />
      </div>
    </>
  )
}
