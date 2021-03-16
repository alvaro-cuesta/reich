import { mathMod } from './util'

const PULSES_PER_BEAT = 2

export const getSecsPerBeat = (bpm) => 60 / bpm

export const getPosition = (
  bpm,
  swing,
  pulsesPerPattern,
  contextStartTime,
  contextNow,
) => {
  if (contextStartTime === false) {
    return {}
  }

  const totalBeats = (contextNow - contextStartTime) / getSecsPerBeat(bpm)

  const totalPulses =
    Math.floor(totalBeats) * PULSES_PER_BEAT +
    (mathMod(totalBeats, 1) < swing ? 0 : 1)

  return {
    pattern: Math.floor(totalPulses / pulsesPerPattern),
    pulse: mathMod(totalPulses, pulsesPerPattern),
    totalPulses,
  }
}
