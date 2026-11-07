let ctx: AudioContext | null = null

/** Must be called from a user gesture so the browser allows audio playback. */
export function unlockAudio() {
  ctx ??= new AudioContext()
  void ctx.resume()
}

export function playAlarm(kind: 'critical' | 'chirp' = 'critical') {
  if (!ctx) return
  const tones = kind === 'critical' ? [880, 660, 880, 660] : [660, 990]
  const start = ctx.currentTime + 0.02
  tones.forEach((freq, i) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.type = kind === 'critical' ? 'square' : 'sine'
    osc.frequency.value = freq
    const t0 = start + i * 0.16
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(kind === 'critical' ? 0.05 : 0.08, t0 + 0.02)
    gain.gain.linearRampToValueAtTime(0, t0 + 0.14)
    osc.connect(gain).connect(ctx!.destination)
    osc.start(t0)
    osc.stop(t0 + 0.15)
  })
}
