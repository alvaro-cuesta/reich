import React, { useCallback, useEffect, useRef, useState } from 'react'

import PatternTable from './PatternTable'
import Input from './Input'

import Oscillator from '../Oscillator'

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

const localStorageGet = (key, parser, defaultVal) => {
  let result = localStorage.getItem(key)
  return result !== null ? parser(result) : defaultVal
}

const parseBool = (b) => b === 'true'

const useHandleSetting = (setState, key, f) => {
  if (typeof f === 'undefined') {
    f = (x) => x
  }

  return useCallback(
    ({ target: { type, value, checked } }) => {
      if (type === 'checkbox') {
        localStorage.setItem(key, checked)
        setState((state) => ({ ...state, [`${key}`]: f(checked) }))
      } else {
        localStorage.setItem(key, value)
        setState((state) => ({ ...state, [`${key}`]: f(value) }))
      }
    },
    [setState, key, f],
  )
}

const App = ({ context }) => {
  const [state, setState] = useState({
    tempo: localStorageGet('tempo', parseInt, 120),
    repeats: localStorageGet('repeats', parseInt, 4),
    swing: localStorageGet('swing', parseFloat, 0.5),
    clap1: localStorageGet('clap1', parseBool, true),
    clap2: localStorageGet('clap2', parseBool, true),
    metronome: localStorageGet('metronome', parseBool, false),
    countMetronome: localStorageGet('countMetronome', parseBool, true),
    startTime: false,
    now: false,
    userInput: false,
  })

  const {
    tempo,
    repeats,
    swing,
    clap1,
    clap2,
    metronome,
    countMetronome,
    userInput,
  } = state

  const clap1Ref = useRef(null)
  const clap2Ref = useRef(null)
  const metronomeRef = useRef(null)
  const timeIntervalRef = useRef(null)
  const lastPulseRef = useRef(null)
  const timeStampRef = useRef(null)

  const getSecsPerBeat = useCallback(() => {
    return 60 / state.tempo
  }, [state.tempo])

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
    let swing = state.swing
    let now = state.now

    if (startTime === false) return {}

    let totalBeats = (now - startTime) / getSecsPerBeat()

    let totalPulses =
      Math.floor(totalBeats) * 2 + ((1 + (totalBeats % 1)) % 1 < swing ? 0 : 1)

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
  }, [getSecsPerBeat, state.startTime, state.swing, state.now])

  const getPulseStart = useCallback(
    (totalPulses) => {
      let startTime = state.startTime
      let swing = state.swing

      let totalBeats =
        Math.floor(totalPulses / 2) + (totalPulses % 2 === 0 ? 0 : swing)

      return startTime + totalBeats * getSecsPerBeat()
    },
    [getSecsPerBeat, state.startTime, state.swing],
  )

  const schedulePulseSound = useCallback(
    (pulse, pattern, totalPulses, instant) => {
      let clap1 = state.clap1
      let clap2 = state.clap2
      let metronome = state.metronome
      let countMetronome = state.countMetronome
      let repeats = state.repeats

      let pulseStart = getPulseStart(totalPulses)
      let pulseEnd = pulseStart + CLAP_LENGTH
      let gain = pulse === 0 ? ACCENT_GAIN : GAIN

      if (pattern >= 0) {
        if (clap1 && CLAP_PATTERN[pulse % CLAP_PATTERN.length]) {
          clap1Ref.current.schedule(gain, pulseStart, pulseEnd)
        }

        let shift = Math.floor(pattern / repeats)
        if (clap2 && CLAP_PATTERN[(shift + pulse) % CLAP_PATTERN.length]) {
          clap2Ref.current.schedule(gain, pulseStart, pulseEnd)
        }
      }

      let isMetronome = metronome && pattern >= 0 && pulse % 2 === 0
      let isCountMetronome = countMetronome && pattern === -1 && pulse % 2 === 0
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
      state.clap1,
      state.clap2,
      state.metronome,
      state.countMetronome,
      state.repeats,
    ],
  )

  // handleSound
  useEffect(() => {
    let repeats = state.repeats
    let { pattern, pulse, totalPulses } = getPosition()

    if (pattern >= (CLAP_PATTERN.length + 1) * repeats) {
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

    if (pattern >= (CLAP_PATTERN.length + 1) * repeats) return

    schedulePulseSound(pulse, pattern, totalPulses)
  }, [getPosition, handleStop, schedulePulseSound, state.repeats])

  // Playback methods

  const handleStart = useCallback(
    ({ timeStamp }) => {
      let countMetronome = state.countMetronome

      context.resume()

      let now = context.currentTime

      clap1Ref.current.cancelScheduledValues()
      clap2Ref.current.cancelScheduledValues()
      metronomeRef.current.cancelScheduledValues()

      timeStampRef.current = timeStamp

      lastPulseRef.current = false

      setState((state) => ({
        ...state,
        startTime: now + (getSecsPerBeat() / 2) * CLAP_PATTERN.length,
        now: now,
        userInput: [],
      }))

      if (countMetronome) {
        metronomeRef.current.schedule(ACCENT_GAIN, now, now + CLAP_LENGTH)
      }

      timeIntervalRef.current = setInterval(() => {
        setState((state) => ({ ...state, now: context.currentTime }))
      }, 1)
    },
    [context, getSecsPerBeat, state.countMetronome],
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
      let swing = state.swing
      let { totalPulses } = getPosition()

      let now = context.currentTime - delta / 1000
      let secsPerBeat = getSecsPerBeat()

      let currPulseDiff =
        (now - getPulseStart(totalPulses)) / (secsPerBeat * swing)
      let nextPulseDiff =
        (getPulseStart(totalPulses + 1) - now) / (secsPerBeat * (1 - swing))

      return {
        currPulseDiff,
        nextPulseDiff,
      }
    },
    [getPosition, getPulseStart, getSecsPerBeat, context, state.swing],
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
          <Input
            label="Tempo:"
            type="number"
            min={1}
            max={999}
            step={1}
            value={tempo}
            onChange={useHandleSetting(setState, 'tempo', parseInt)}
          />
          <Input
            label="Repeats:"
            type="number"
            min={1}
            max={999}
            step={1}
            value={repeats}
            onChange={useHandleSetting(setState, 'repeats', parseInt)}
          />
          <Input
            label="Swing:"
            type="number"
            min={0.1}
            max={0.9}
            step={0.01}
            value={swing}
            onChange={useHandleSetting(setState, 'swing', parseFloat)}
          />
        </fieldset>

        <fieldset>
          <div className="noselect">Sounds:</div>
          <Input
            label="Clap 1"
            type="checkbox"
            checked={clap1}
            onChange={useHandleSetting(setState, 'clap1')}
          />
          <Input
            label="Clap 2"
            type="checkbox"
            checked={clap2}
            onChange={useHandleSetting(setState, 'clap2')}
          />
          <Input
            label="Metronome"
            type="checkbox"
            checked={metronome}
            onChange={useHandleSetting(setState, 'metronome')}
          />
          <Input
            label="Count"
            type="checkbox"
            checked={countMetronome}
            onChange={useHandleSetting(setState, 'countMetronome')}
          />
        </fieldset>
      </div>

      <PatternTable
        buttonHandler={buttonHandler}
        buttonLabel={buttonLabel}
        clapPattern={CLAP_PATTERN}
        pattern={pattern}
        pulse={pulse}
        repeats={repeats}
        userInput={userInput}
      />
    </div>
  )
}

App.propTypes = {}

export default App
