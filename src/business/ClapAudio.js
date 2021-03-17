import Oscillator from './Oscillator'
import { getPulseStart, getTotalPulses, getSecsPerBeat } from './tempo'
import { mathMod } from './util'

const CLAP_LENGTH = 0.0125
const CLAP1_F = 440
const CLAP2_F = 230
const METRONOME_F = 890
const METRONOME_ACCENT_F = 1780
const ACCENT_GAIN = 1
const GAIN = 0.25

export default class ClapAudio {
  constructor(
    audioContext,
    clapPattern,
    bpm,
    repeats,
    swing,
    clap1,
    clap2,
    metronome,
    countMetronome,
    onUpdate,
  ) {
    this.audioContext = audioContext
    this.clapPattern = clapPattern

    this.clap1Osc = new Oscillator(this.audioContext, CLAP1_F)
    this.clap2Osc = new Oscillator(this.audioContext, CLAP2_F)
    this.metronomeOsc = new Oscillator(this.audioContext, METRONOME_ACCENT_F)

    this.startTime = null
    this.lastPulse = null

    this.bpm = bpm
    this.repeats = repeats
    this.swing = swing

    this.clap1 = clap1
    this.clap2 = clap2
    this.metronome = metronome
    this.countMetronome = countMetronome

    this.onUpdate = onUpdate
  }

  start() {
    this.stop()

    this.audioContext.resume()

    this.startTime =
      this.audioContext.currentTime +
      (getSecsPerBeat(this.bpm) / 2) * this.clapPattern.length

    if (this.countMetronome) {
      this.metronomeOsc.schedule(
        ACCENT_GAIN,
        this.startTime,
        this.startTime + CLAP_LENGTH,
      )
    }

    this.onUpdate(this.startTime, this.startTime)

    const schedule = () => {
      this.schedule()

      if (this.startTime !== null) {
        requestAnimationFrame(schedule)
      }
    }

    requestAnimationFrame(schedule)
  }

  stop() {
    this.startTime = null
    this.lastPulse = null

    this.clap1Osc.cancelScheduledValues()
    this.clap2Osc.cancelScheduledValues()
    this.metronomeOsc.cancelScheduledValues()

    this.onUpdate(null, null)
  }

  destroy() {
    this.stop()

    this.clap1Osc.disconnect()
    this.clap2Osc.disconnect()
    this.metronomeOsc.disconnect()
  }

  //

  schedule() {
    if (this.startTime === null) {
      return
    }

    const totalPulses = getTotalPulses(
      this.bpm,
      this.swing,
      this.startTime,
      this.audioContext.currentTime,
    )

    const maxPulses =
      (this.clapPattern.length + 1) * this.repeats * this.clapPattern.length

    // After last pulse, auto stop
    if (totalPulses >= maxPulses) {
      this.stop()
      return
    }

    // Pulse already scheduled, bail out
    if (totalPulses === this.lastPulse) {
      return
    }

    this.lastPulse = totalPulses

    // Schedule _next_ pulse
    const nextPulse = totalPulses + 1

    if (nextPulse >= maxPulses) {
      return
    }

    this.schedulePulseSound(totalPulses + 1)

    this.onUpdate(this.startTime, this.audioContext.currentTime)
  }

  schedulePulseSound(totalPulses) {
    const pattern = Math.floor(totalPulses / this.clapPattern.length)
    const pulse = mathMod(totalPulses, this.clapPattern.length)

    const pulseStart = getPulseStart(
      this.bpm,
      this.swing,
      this.startTime,
      totalPulses,
    )
    const pulseEnd = pulseStart + CLAP_LENGTH
    const gain = pulse === 0 ? ACCENT_GAIN : GAIN

    if (pattern >= 0) {
      if (this.clap1 && this.clapPattern[pulse % this.clapPattern.length]) {
        this.clap1Osc.schedule(gain, pulseStart, pulseEnd)
      }

      const shift = Math.floor(pattern / this.repeats)
      if (
        this.clap2 &&
        this.clapPattern[(shift + pulse) % this.clapPattern.length]
      ) {
        this.clap2Osc.schedule(gain, pulseStart, pulseEnd)
      }
    }

    const isMetronome = this.metronome && pattern >= 0 && pulse % 2 === 0

    const isCountMetronome =
      this.countMetronome && pattern === -1 && pulse % 2 === 0

    if (isMetronome || isCountMetronome) {
      this.metronomeOsc.scheduleFrequency(
        pulse === 0 ? METRONOME_ACCENT_F : METRONOME_F,
        pulseStart,
      )

      this.metronomeOsc.schedule(gain, pulseStart, pulseEnd)
    }
  }
}
