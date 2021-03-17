import React, { useCallback, useEffect, useRef, useState } from 'react'

import PatternTable from './PatternTable'
import Input from './Input'

import Oscillator from '../Oscillator'

import useInputInteger from '../hooks/useInputInteger'
import useInputFloat from '../hooks/useInputFloat'
import useInputCheckbox from '../hooks/useInputCheckbox'
import {
  getPulseDiff,
  getPulseStart,
  getSecsPerBeat,
  getTotalPulses,
} from '../business/tempo'
import { mathMod } from '../business/util'

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
    startTime: null,
    now: null,
  })

  const [userInput, setUserInput] = useState([])

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

  const handleStop = useCallback(() => {
    clearInterval(timeIntervalRef.current)

    clap1Ref.current.cancelScheduledValues()
    clap2Ref.current.cancelScheduledValues()
    metronomeRef.current.cancelScheduledValues()

    setState({
      startTime: null,
      now: null,
    })
  }, [])

  const schedulePulseSound = useCallback(
    (totalPulses) => {
      const pattern = Math.floor(totalPulses / CLAP_PATTERN.length)
      const pulse = mathMod(totalPulses, CLAP_PATTERN.length)

      const pulseStart = getPulseStart(
        tempo.value,
        swing.value,
        state.startTime,
        totalPulses,
      )
      const pulseEnd = pulseStart + CLAP_LENGTH
      const gain = pulse === 0 ? ACCENT_GAIN : GAIN

      if (pattern >= 0) {
        if (clap1.checked && CLAP_PATTERN[pulse % CLAP_PATTERN.length]) {
          clap1Ref.current.schedule(gain, pulseStart, pulseEnd)
        }

        const shift = Math.floor(pattern / repeats.value)
        if (
          clap2.checked &&
          CLAP_PATTERN[(shift + pulse) % CLAP_PATTERN.length]
        ) {
          clap2Ref.current.schedule(gain, pulseStart, pulseEnd)
        }
      }

      const isMetronome = metronome.checked && pattern >= 0 && pulse % 2 === 0
      const isCountMetronome =
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
      clap1.checked,
      clap2.checked,
      metronome.checked,
      countMetronome.checked,
      repeats.value,
      state.startTime,
      swing.value,
      tempo.value,
    ],
  )

  // handleSound
  useEffect(() => {
    if (state.startTime === null) {
      return
    }

    const totalPulses = getTotalPulses(
      tempo.value,
      swing.value,
      state.startTime,
      state.now,
    )

    const maxPulses =
      (CLAP_PATTERN.length + 1) * repeats.value * CLAP_PATTERN.length

    // After last pulse, auto stop
    if (totalPulses >= maxPulses) {
      handleStop()
      return
    }

    // Pulse already scheduled, bail out
    if (totalPulses === lastPulseRef.current) {
      return
    }

    lastPulseRef.current = totalPulses

    // Schedule _next_ pulse
    const nextPulse = totalPulses + 1

    if (nextPulse >= maxPulses) {
      return
    }

    schedulePulseSound(totalPulses + 1)
  }, [
    handleStop,
    schedulePulseSound,
    repeats.value,
    tempo.value,
    swing.value,
    state.startTime,
    state.now,
  ])

  // Playback methods

  const handleStart = useCallback(
    ({ timeStamp }) => {
      context.resume()

      const now = context.currentTime

      clap1Ref.current.cancelScheduledValues()
      clap2Ref.current.cancelScheduledValues()
      metronomeRef.current.cancelScheduledValues()

      timeStampRef.current = timeStamp

      lastPulseRef.current = null

      setState({
        startTime:
          now + (getSecsPerBeat(tempo.value) / 2) * CLAP_PATTERN.length,
        now: now,
      })

      setUserInput([])

      if (countMetronome.checked) {
        metronomeRef.current.schedule(ACCENT_GAIN, now, now + CLAP_LENGTH)
      }

      timeIntervalRef.current = setInterval(() => {
        setState((state) => ({
          startTime: state.startTime,
          now: context.currentTime,
        }))
      }, 1)
    },
    [context, tempo.value, countMetronome.checked],
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

  useEffect(() => {
    const handleKeyDown = ({ repeat, key, keyCode, timeStamp }) => {
      if (repeat) {
        return
      }

      if (state.startTime === null) {
        return
      }

      const totalPulses = getTotalPulses(
        tempo.value,
        swing.value,
        state.startTime,
        context.currentTime,
      )

      const eventTimeFix = (performance.now() - timeStamp) / 1000

      const { currPulseDiff, nextPulseDiff } = getPulseDiff(
        tempo.value,
        swing.value,
        state.startTime,
        context.currentTime - eventTimeFix,
      )

      if (CLAP1_KEYS.includes(keyCode)) {
        console.log('clap1', currPulseDiff, nextPulseDiff)

        setUserInput((userInput) => {
          const hitTotalPulses =
            totalPulses + (currPulseDiff >= nextPulseDiff ? 1 : 0)
          const hitPulseDiff =
            currPulseDiff >= nextPulseDiff ? nextPulseDiff : currPulseDiff

          const pattern = Math.floor(hitTotalPulses / CLAP_PATTERN.length)
          const pulse = mathMod(hitTotalPulses, CLAP_PATTERN.length)

          userInput = [...userInput]
          userInput[pattern] = [...(userInput[pattern] || [])]
          userInput[pattern][pulse] = hitPulseDiff

          return userInput
        })
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
  }, [tempo.value, swing.value, state.startTime, context])

  // RENDER

  let pattern, pulse
  if (state.startTime !== null) {
    const totalPulses = getTotalPulses(
      tempo.value,
      swing.value,
      state.startTime,
      context.currentTime,
    )

    pattern = Math.floor(totalPulses / CLAP_PATTERN.length)
    pulse = mathMod(totalPulses, CLAP_PATTERN.length)
  }

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
      <header>
        <h1>
          <a href={process.env.PUBLIC_URL}>Reich Clapping Trainer</a>
        </h1>
      </header>

      <section>
        <p>
          <a
            href="https://en.wikipedia.org/wiki/Clapping_Music"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clapping Music
          </a>{' '}
          is a minimalist piece written by{' '}
          <a
            href="https://en.wikipedia.org/wiki/Steve_Reich"
            target="_blank"
            rel="noopener noreferrer"
          >
            Steve Reich
          </a>
          . It is written for two performers and is performed entirely by
          clapping.
        </p>
        <p>
          For a live example, watch the{' '}
          <a
            href="https://www.youtube.com/watch?v=liYkRarIDfo"
            target="_blank"
            rel="noopener noreferrer"
          >
            video performed by London Sinfonietta percussionists
          </a>{' '}
          David Hockings and Toby Kearney.
        </p>
        <p>
          Developed by{' '}
          <a href="https://github.com/alvaro-cuesta/">Álvaro Cuesta</a>. Code
          available on{' '}
          <a href="https://github.com/alvaro-cuesta/reich">GitHub</a>.
        </p>
      </section>

      <section>
        <h2>Instructions</h2>

        <p>
          Press "START" and wait for the initial count to 6, then clap as "Clap
          2" by pressing "Z" in your keyboard.
        </p>
      </section>

      <section>
        <h2>Settings</h2>

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
      </section>

      <main>
        <PatternTable
          buttonHandler={buttonHandler}
          buttonLabel={buttonLabel}
          clapPattern={CLAP_PATTERN}
          pattern={pattern}
          pulse={pulse}
          repeats={repeats.value}
          userInput={userInput}
        />
      </main>
    </div>
  )
}

App.propTypes = {}

export default App
