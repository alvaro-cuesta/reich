import { mathMod } from './util'

const PULSES_PER_BEAT = 2

export const getSecsPerBeat = (bpm) => 60 / bpm

export const getTotalPulses = (bpm, swing, startTime, currentTime) => {
  const totalBeats = (currentTime - startTime) / getSecsPerBeat(bpm)

  const totalPulses =
    Math.floor(totalBeats) * PULSES_PER_BEAT +
    (mathMod(totalBeats, 1) < swing ? 0 : 1)

  return totalPulses
}

export const getPulseStart = (bpm, swing, startTime, totalPulses) => {
  const totalBeats =
    Math.floor(totalPulses / PULSES_PER_BEAT) +
    (totalPulses % PULSES_PER_BEAT === 0 ? 0 : swing)

  return startTime + totalBeats * getSecsPerBeat(bpm)
}

export const getPulseDiff = (bpm, swing, startTime, currentTime) => {
  const totalPulses = getTotalPulses(bpm, swing, startTime, currentTime)

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
