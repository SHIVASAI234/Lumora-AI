import { useEffect } from 'react'
import { playAlarm } from '../lib/alarm.ts'
import { useStore } from '../store.ts'

const COOLDOWN_MS = 4000

/** Plays the alarm when a node newly turns critical, if the user enabled sound. */
export function useAlarm() {
  useEffect(() => {
    let lastPlayed = 0
    return useStore.subscribe((s, prev) => {
      if (s.events === prev.events || !s.alarmEnabled) return
      const fresh = s.events.filter((e) => !prev.events.includes(e))
      if (fresh.some((e) => e.to === 'critical') && Date.now() - lastPlayed > COOLDOWN_MS) {
        lastPlayed = Date.now()
        playAlarm('critical')
      }
    })
  }, [])
}
