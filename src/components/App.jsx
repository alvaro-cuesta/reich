import React, { useCallback, useEffect, useRef, useState } from 'react'

import PatternTable from './PatternTable'
import Input from './Input'

import Oscillator from '../Oscillator'

import useInputInteger from '../hooks/useInputInteger'
import useInputFloat from '../hooks/useInputFloat'
import useInputCheckbox from '../hooks/useInputCheckbox'

const CLAP_PATTERN = [
  true,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  true,
  false,
]
const CLAP_LENGTH = 0.0125
const CLAP1_F = 440
const CLAP2_F = 230
const METRONOME_F = 890
const METRONOME_ACCENT_F = 1780
const ACCENT_GAIN = 1
const GAIN = 0.25
const CLAP1_KEYS = [90]
const CLAP2_KEYS = [77]

const App = ({ context }) => {
  const [state, setState] = useState({
    startTime: false,
    now: false,
    userInput: false,
  })

  const tempo = useInputInteger('tempo', { min: 1, max: 999, step: 1 }, 120)
  const repeats = useInputInteger('repeats', { min: 1, max: 999, step: 1 }, 4)
  const swing = useInputFloat('swing', { min: 0.1, max: 0.9, step: 0.01 }, 0.5)
  const clap1 = useInputCheckbox('clap1', true)
  const clap2 = useInputCheckbox('clap2', true)
  const metronome = useInputCheckbox('metronome', false)
  const countMetronome = useInputCheckbox('countMetronome', true)

  const clap1Ref = useRef(null)
  const clap2Ref = useRef(null)
  const metronomeRef = useRef(null)
  const timeIntervalRef = useRef(null)
  const lastPulseRef = useRef(null)
  const timeStampRef = useRef(null)

  const secsPerBeat = 60 / tempo.value

  const handleStop = useCallback(() => {
    clearInterval(timeIntervalRef.current)

    clap1Ref.current.cancelScheduledValues()
    clap2Ref.current.cancelScheduledValues()
    metronomeRef.current.cancelScheduledValues()

    setState((state) => ({
      ...state,
      startTime: false,
      now: false,
    }))
  }, [])

  const getPosition = useCallback(() => {
    let startTime = state.startTime
    let now = state.now

    if (startTime === false) return {}

    let totalBeats = (now - startTime) / secsPerBeat

    let totalPulses =
      Math.floor(totalBeats) * 2 +
      ((1 + (totalBeats % 1)) % 1 < swing.value ? 0 : 1)

    // console.log(totalPulses);

    if (startTime >= now) {
      let pulse = totalPulses
      while (pulse < 0) pulse += CLAP_PATTERN.length

      return {
        pattern: Math.floor(totalPulses / CLAP_PATTERN.length),
        pulse,
        totalPulses,
      }
    }

    return {
      pattern: Math.floor(totalPulses / CLAP_PATTERN.length),
      pulse: totalPulses % CLAP_PATTERN.length,
      totalPulses,
    }
  }, [secsPerBeat, state.startTime, swing.value, state.now])

  const getPulseStart = useCallback(
    (totalPulses) => {
      let startTime = state.startTime

      let totalBeats =
        Math.floor(totalPulses / 2) + (totalPulses % 2 === 0 ? 0 : swing.value)

      return startTime + totalBeats * secsPerBeat
    },
    [secsPerBeat, state.startTime, swing.value],
  )

  const schedulePulseSound = useCallback(
    (pulse, pattern, totalPulses, instant) => {
      let pulseStart = getPulseStart(totalPulses)
      let pulseEnd = pulseStart + CLAP_LENGTH
      let gain = pulse === 0 ? ACCENT_GAIN : GAIN

      if (pattern >= 0) {
        if (clap1.checked && CLAP_PATTERN[pulse % CLAP_PATTERN.length]) {
          clap1Ref.current.schedule(gain, pulseStart, pulseEnd)
        }

        let shift = Math.floor(pattern / repeats.value)
        if (
          clap2.checked &&
          CLAP_PATTERN[(shift + pulse) % CLAP_PATTERN.length]
        ) {
          clap2Ref.current.schedule(gain, pulseStart, pulseEnd)
        }
      }

      let isMetronome = metronome.checked && pattern >= 0 && pulse % 2 === 0
      let isCountMetronome =
        countMetronome.checked && pattern === -1 && pulse % 2 === 0
      if (isMetronome || isCountMetronome) {
        metronomeRef.current.scheduleFrequency(
          pulse === 0 ? METRONOME_ACCENT_F : METRONOME_F,
          pulseStart,
        )
        metronomeRef.current.schedule(gain, pulseStart, pulseEnd)
      }
    },
    [
      getPulseStart,
      clap1.checked,
      clap2.checked,
      metronome.checked,
      countMetronome.checked,
      repeats.value,
    ],
  )

  // handleSound
  useEffect(() => {
    let { pattern, pulse, totalPulses } = getPosition()

    if (pattern >= (CLAP_PATTERN.length + 1) * repeats.value) {
      handleStop()
      return
    }

    if (lastPulseRef.current === false) {
      // Just started: schedfule first pulse
      lastPulseRef.current = 0
    } else {
      if (pulse === lastPulseRef.current) return
      lastPulseRef.current = pulse
    }

    // Schedule _next_ pulse

    pulse += 1
    totalPulses += 1

    if (pulse === CLAP_PATTERN.length) {
      pulse = 0
      pattern += 1
    }

    if (pattern >= (CLAP_PATTERN.length + 1) * repeats.value) return

    schedulePulseSound(pulse, pattern, totalPulses)
  }, [getPosition, handleStop, schedulePulseSound, repeats.value])

  // Playback methods

  const handleStart = useCallback(
    ({ timeStamp }) => {
      context.resume()

      let now = context.currentTime

      clap1Ref.current.cancelScheduledValues()
      clap2Ref.current.cancelScheduledValues()
      metronomeRef.current.cancelScheduledValues()

      timeStampRef.current = timeStamp

      lastPulseRef.current = false

      setState((state) => ({
        ...state,
        startTime: now + (secsPerBeat / 2) * CLAP_PATTERN.length,
        now: now,
        userInput: [],
      }))

      if (countMetronome.checked) {
        metronomeRef.current.schedule(ACCENT_GAIN, now, now + CLAP_LENGTH)
      }

      timeIntervalRef.current = setInterval(() => {
        setState((state) => ({ ...state, now: context.currentTime }))
      }, 1)
    },
    [context, secsPerBeat, countMetronome.checked],
  )

  useEffect(() => {
    clap1Ref.current = new Oscillator(context, CLAP1_F)
    clap2Ref.current = new Oscillator(context, CLAP2_F)
    metronomeRef.current = new Oscillator(context, METRONOME_ACCENT_F)

    return () => {
      handleStop()

      clap1Ref.current.disconnect()
      clap2Ref.current.disconnect()
      metronomeRef.current.disconnect()
    }
  }, [context, handleStop])

  //

  const getPulseDiff = useCallback(
    (delta) => {
      let { totalPulses } = getPosition()

      let now = context.currentTime - delta / 1000

      let currPulseDiff =
        (now - getPulseStart(totalPulses)) / (secsPerBeat * swing.value)
      let nextPulseDiff =
        (getPulseStart(totalPulses + 1) - now) /
        (secsPerBeat * (1 - swing.value))

      return {
        currPulseDiff,
        nextPulseDiff,
      }
    },
    [getPosition, getPulseStart, secsPerBeat, context, swing.value],
  )

  useEffect(() => {
    const handleKeyDown = ({ repeat, key, keyCode, timeStamp }) => {
      if (repeat) return

      let userInput = state.userInput
      let { pattern, pulse } = getPosition()

      let { currPulseDiff, nextPulseDiff } = getPulseDiff(
        performance.now() - timeStamp,
      )

      if (CLAP1_KEYS.includes(keyCode)) {
        console.log('clap1', currPulseDiff, nextPulseDiff)

        if (userInput[pattern] === undefined) {
          userInput[pattern] = []
        }

        if (currPulseDiff < nextPulseDiff) {
          userInput[pattern][pulse] = currPulseDiff
        } else {
          pulse += 1
          if (pulse === CLAP_PATTERN.length) {
            pulse = 0
            pattern += 1

            if (userInput[pattern] === undefined) {
              userInput[pattern] = []
            }
          }

          userInput[pattern][pulse] = nextPulseDiff
        }

        setState((state) => ({ ...state, userInput }))
      } else if (CLAP2_KEYS.includes(keyCode)) {
        console.log('clap2', currPulseDiff, nextPulseDiff)
      } else {
        console.log(key, keyCode)
      }
    }

    window.addEventListener('keydown', handleKeyDown, false)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, false)
    }
  }, [getPosition, getPulseDiff, state.userInput])

  // RENDER

  let { pattern, pulse } = getPosition()

  let buttonHandler, buttonLabel
  if (pattern === undefined) {
    buttonHandler = handleStart
    buttonLabel = 'Start'
  } else if (pattern < 0) {
    buttonHandler = handleStop
    buttonLabel = Math.floor(pulse / 2) + 1
  } else {
    buttonHandler = handleStop
    buttonLabel = 'Stop'
  }

  return (
    <div className="reich-app">
      <div className="controls">
        <fieldset className="tempo">
          <Input label="Tempo:" {...tempo} />
          <Input label="Repeats:" {...repeats} />
          <Input label="Swing:" {...swing} />
        </fieldset>

        <fieldset>
          <div className="noselect">Sounds:</div>
          <Input label="Clap 1" {...clap1} />
          <Input label="Clap 2" {...clap2} />
          <Input label="Metronome" {...metronome} />
          <Input label="Count" {...countMetronome} />
        </fieldset>
      </div>

      <PatternTable
        buttonHandler={buttonHandler}
        buttonLabel={buttonLabel}
        clapPattern={CLAP_PATTERN}
        pattern={pattern}
        pulse={pulse}
        repeats={repeats.value}
        userInput={state.userInput}
      />
    </div>
  )
}

App.propTypes = {}

export default App
