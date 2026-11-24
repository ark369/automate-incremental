import type { ActId } from '../content/types'

let ctx: AudioContext | null = null
let muted = false

function getContext(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null
  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

export function setSoundMuted(next: boolean): void {
  muted = next
}

export function isSoundMuted(): boolean {
  return muted
}

function playTone(
  freq: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = 'sine',
  delay = 0,
): void {
  const audio = getContext()
  if (!audio) return
  const now = audio.currentTime + delay
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export function playTap(): void {
  playTone(340, 0.055, 0.035, 'triangle')
}

export function playTaskComplete(): void {
  playTone(520, 0.09, 0.04, 'sine')
  playTone(660, 0.11, 0.03, 'sine', 0.045)
}

export function playApprove(act: ActId): void {
  if (act >= 4) {
    // Softer, calmer harmonic chime in late acts
    playTone(440, 0.24, 0.032, 'sine')
    playTone(554.37, 0.3, 0.025, 'sine', 0.07)
    return
  }
  playTone(587.33, 0.1, 0.045, 'sine')
  playTone(880, 0.15, 0.038, 'sine', 0.055)
}

export function playAutomate(): void {
  playTone(392, 0.16, 0.04, 'sine')
  playTone(493.88, 0.18, 0.04, 'sine', 0.06)
  playTone(587.33, 0.26, 0.038, 'sine', 0.12)
}

export function playPing(): void {
  playTone(760, 0.05, 0.02, 'triangle')
  playTone(960, 0.065, 0.018, 'triangle', 0.055)
}

export function playFinalHandover(): void {
  playTone(261.63, 1.4, 0.038, 'sine', 0)
  playTone(329.63, 1.6, 0.032, 'sine', 0.12)
  playTone(392.0, 1.8, 0.028, 'sine', 0.24)
  playTone(523.25, 2.2, 0.022, 'sine', 0.36)
}
