import { mathMod } from './util'

const PULSES_PER_BEAT = 2

export const getSecsPerBeat = (bpm) => 60 / bpm

export const getPosition = (
  bpm,
  swing,
  pulsesPerPattern,
  stateStartTime,
  stateNow,
) => {
  if (stateStartTime === false) {
    return {}
  }

  const totalBeats = (stateNow - stateStartTime) / getSecsPerBeat(bpm)

  const totalPulses =
    Math.floor(totalBeats) * PULSES_PER_BEAT +
    (mathMod(totalBeats, 1) < swing ? 0 : 1)

  return {
    pattern: Math.floor(totalPulses / pulsesPerPattern),
    pulse: mathMod(totalPulses, pulsesPerPattern),
    totalPulses,
  }
}

export const getPulseStart = (bpm, swing, stateStartTime, totalPulses) => {
  const totalBeats =
    Math.floor(totalPulses / PULSES_PER_BEAT) +
    (totalPulses % PULSES_PER_BEAT === 0 ? 0 : swing)

  return stateStartTime + totalBeats * getSecsPerBeat(bpm)
}

export const getPulseDiff = (
  bpm,
  swing,
  pulsesPerPattern,
  stateStartTime,
  stateNow,
  contextCurrentTime,
  delta,
) => {
  const { totalPulses } = getPosition(
    bpm,
    swing,
    pulsesPerPattern,
    stateStartTime,
    stateNow,
  )

  const now = contextCurrentTime - delta / 1000

  const secsPerBeat = getSecsPerBeat(bpm)

  const currPulseDiff =
    (now - getPulseStart(bpm, swing, stateStartTime, totalPulses)) /
    (secsPerBeat * swing)

  const nextPulseDiff =
    (getPulseStart(bpm, swing, stateStartTime, totalPulses + 1) - now) /
    (secsPerBeat * (1 - swing))

  return {
    currPulseDiff,
    nextPulseDiff,
  }
}
