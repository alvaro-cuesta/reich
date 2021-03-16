import { mathMod } from './util'

const PULSES_PER_BEAT = 2

export const getSecsPerBeat = (bpm) => 60 / bpm

export const getPosition = (
  bpm,
  swing,
  pulsesPerPattern,
  startTime,
  currentTime,
) => {
  if (startTime === null) {
    return {}
  }

  const totalBeats = (currentTime - startTime) / getSecsPerBeat(bpm)

  const totalPulses =
    Math.floor(totalBeats) * PULSES_PER_BEAT +
    (mathMod(totalBeats, 1) < swing ? 0 : 1)

  return {
    pattern: Math.floor(totalPulses / pulsesPerPattern),
    pulse: mathMod(totalPulses, pulsesPerPattern),
    totalPulses,
  }
}

export const getPulseStart = (bpm, swing, startTime, totalPulses) => {
  const totalBeats =
    Math.floor(totalPulses / PULSES_PER_BEAT) +
    (totalPulses % PULSES_PER_BEAT === 0 ? 0 : swing)

  return startTime + totalBeats * getSecsPerBeat(bpm)
}

export const getPulseDiff = (
  bpm,
  swing,
  pulsesPerPattern,
  startTime,
  currentTime,
) => {
  const { totalPulses } = getPosition(
    bpm,
    swing,
    pulsesPerPattern,
    startTime,
    currentTime,
  )

  const secsPerBeat = getSecsPerBeat(bpm)

  const currPulseDiff =
    (currentTime - getPulseStart(bpm, swing, startTime, totalPulses)) /
    (secsPerBeat * swing)

  const nextPulseDiff =
    (getPulseStart(bpm, swing, startTime, totalPulses + 1) - currentTime) /
    (secsPerBeat * (1 - swing))

  return {
    currPulseDiff,
    nextPulseDiff,
  }
}
