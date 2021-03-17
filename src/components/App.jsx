import React, { useCallback, useEffect, useRef, useState } from 'react'

import PatternTable from './PatternTable'
import Input from './Input'

import ClapAudio from '../business/ClapAudio'

import useInputInteger from '../hooks/useInputInteger'
import useInputFloat from '../hooks/useInputFloat'
import useInputCheckbox from '../hooks/useInputCheckbox'
import { getPulseDiff, getTotalPulses } from '../business/tempo'
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

  const clapAudioRef = useRef()

  const handleStart = useCallback(() => {
    clapAudioRef.current.start()
    setUserInput([])
  }, [])

  const handleStop = useCallback(() => {
    clapAudioRef.current.stop()
  }, [])

  // TODO: Propagate states to ref

  useEffect(() => {
    clapAudioRef.current = new ClapAudio(
      context,
      CLAP_PATTERN,
      tempo.value,
      repeats.value,
      swing.value,
      clap1.checked,
      clap2.checked,
      metronome.checked,
      countMetronome.checked,
      (startTime, now) => {
        setState({ startTime, now })
      },
    )

    return () => {
      clapAudioRef.current.destroy()
    }

    // HACK? We just want the initial values for the clap audio
    //       See below for how we synchronize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context])

  // HACK? This should probably be part of the `onChange` handlers
  useEffect(() => {
    clapAudioRef.current.bpm = tempo.value
  }, [tempo.value])

  useEffect(() => {
    clapAudioRef.current.repeats = repeats.value
  }, [repeats.value])

  useEffect(() => {
    clapAudioRef.current.swing = swing.value
  }, [swing.value])

  useEffect(() => {
    clapAudioRef.current.clap1 = clap1.checked
  }, [clap1.checked])

  useEffect(() => {
    clapAudioRef.current.clap2 = clap2.checked
  }, [clap2.checked])

  useEffect(() => {
    clapAudioRef.current.metronome = metronome.checked
  }, [metronome.checked])

  useEffect(() => {
    clapAudioRef.current.countMetronome = countMetronome.checked
  }, [countMetronome.checked])

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
