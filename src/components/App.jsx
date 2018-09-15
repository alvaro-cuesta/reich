import React from 'react'
import { hot } from 'react-hot-loader'

import PatternTable from 'components/PatternTable'

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

const Input = ({ label, ...props }) => (
  <label>
    {props.type !== 'checkbox' ? (
      <span className="label noselect">{label}</span>
    ) : null}
    <input {...props} />
    {props.type === 'checkbox' ? (
      <span className="label noselect">{label}</span>
    ) : null}
  </label>
)

class Oscillator {
  constructor(context, f) {
    this.f = f
    this.context = context

    this.oscillator = context.createOscillator()
    this.oscillator.type = 'square'
    this.oscillator.frequency.value = f

    this.gain = context.createGain()
    this.gain.gain.value = 0

    this.oscillator.start()
    this.oscillator.connect(this.gain)

    this.gain.connect(context.destination)
  }

  schedule(gain, start, end) {
    this.gain.gain.setValueAtTime(gain, start)
    this.gain.gain.setValueAtTime(0, end)
  }

  scheduleFrequency(frequency, start) {
    this.oscillator.frequency.setValueAtTime(frequency, start)
  }

  cancelScheduledValues() {
    let now = this.context.currentTime

    this.oscillator.frequency.cancelScheduledValues(now)
    this.gain.gain.cancelScheduledValues(now)

    this.gain.gain.value = 0
    this.oscillator.frequency.value = this.f
  }

  disconnect() {
    this.gain.disconnect()
    this.oscillator.disconnect()
  }
}

const parseBool = (b) => b === 'true'

class App extends React.PureComponent {
  constructor(props) {
    super(props)

    let { context } = props

    this.clap1 = new Oscillator(context, CLAP1_F)
    this.clap2 = new Oscillator(context, CLAP2_F)
    this.metronome = new Oscillator(context, METRONOME_ACCENT_F)

    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleSound = this.handleSound.bind(this)
    this.handleStart = this.handleStart.bind(this)
    this.handleStop = this.handleStop.bind(this)
    this.handleSetting = this.handleSetting.bind(this)

    this.state = {
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
    }
  }

  componentWillMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    this.handleStop()

    this.clap1.disconnect()
    this.clap2.disconnect()
    this.metronome.disconnect()

    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  //

  handleKeyDown({ repeat, key, keyCode, timeStamp }) {
    if (repeat) return

    let { userInput } = this.state
    let { pattern, pulse } = this.getPosition()
    let { currPulseDiff, nextPulseDiff } = this.getPulseDiff(
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

      this.setState({ userInput })
    } else if (CLAP2_KEYS.includes(keyCode)) {
      console.log('clap2', currPulseDiff, nextPulseDiff)
    } else {
      console.log(key, keyCode)
    }
  }

  handleSetting(key, f) {
    if (typeof f === 'undefined') {
      f = (x) => x
    }

    return ({ target: { type, value, checked } }) => {
      if (type === 'checkbox') {
        localStorage.setItem(key, checked)
        this.setState({ [`${key}`]: f(checked) })
      } else {
        localStorage.setItem(key, value)
        this.setState({ [`${key}`]: f(value) })
      }
    }
  }

  handleStart({ timeStamp }) {
    let { context } = this.props
    let { countMetronome } = this.state

    let now = context.currentTime

    this.clap1.cancelScheduledValues()
    this.clap2.cancelScheduledValues()
    this.metronome.cancelScheduledValues()

    this.performanceNow = performance.now()
    this.timeStamp = timeStamp

    this.lastPulse = false

    this.setState({
      startTime: now + (this.getSecsPerBeat() / 2) * CLAP_PATTERN.length,
      now: now,
      userInput: [],
    })

    if (countMetronome) {
      this.metronome.schedule(ACCENT_GAIN, now, now + CLAP_LENGTH)
    }

    this.timeInterval = setInterval(() => {
      this.setState({ now: context.currentTime }, this.handleSound)
    }, 1)
  }

  handleStop() {
    let { context } = this.props

    clearInterval(this.timeInterval)

    this.clap1.cancelScheduledValues()
    this.clap2.cancelScheduledValues()
    this.metronome.cancelScheduledValues()

    this.setState({
      startTime: false,
      now: false,
    })
  }

  //

  handleSound() {
    let { repeats } = this.state
    let { pattern, pulse, totalPulses } = this.getPosition()

    if (pattern >= (CLAP_PATTERN.length + 1) * repeats) {
      this.handleStop()
      return
    }

    if (this.lastPulse === false) {
      // Just started: schedfule first pulse
      this.lastPulse = 0
    } else {
      if (pulse === this.lastPulse) return
      this.lastPulse = pulse
    }

    // Schedule _next_ pulse

    pulse += 1
    totalPulses += 1

    if (pulse === CLAP_PATTERN.length) {
      pulse = 0
      pattern += 1
    }

    if (pattern >= (CLAP_PATTERN.length + 1) * repeats) return

    this.schedulePulseSound(pulse, pattern, totalPulses)
  }

  schedulePulseSound(pulse, pattern, totalPulses, instant) {
    let { clap1, clap2, metronome, countMetronome, repeats } = this.state

    let pulseStart = this.getPulseStart(totalPulses)
    let pulseEnd = pulseStart + CLAP_LENGTH
    let gain = pulse === 0 ? ACCENT_GAIN : GAIN

    if (pattern >= 0) {
      if (clap1 && CLAP_PATTERN[pulse % CLAP_PATTERN.length]) {
        this.clap1.schedule(gain, pulseStart, pulseEnd)
      }

      let shift = Math.floor(pattern / repeats)
      if (clap2 && CLAP_PATTERN[(shift + pulse) % CLAP_PATTERN.length]) {
        this.clap2.schedule(gain, pulseStart, pulseEnd)
      }
    }

    let isMetronome = metronome && pattern >= 0 && pulse % 2 === 0
    let isCountMetronome = countMetronome && pattern === -1 && pulse % 2 === 0
    if (isMetronome || isCountMetronome) {
      this.metronome.scheduleFrequency(
        pulse === 0 ? METRONOME_ACCENT_F : METRONOME_F,
        pulseStart,
      )
      this.metronome.schedule(gain, pulseStart, pulseEnd)
    }
  }

  getSecsPerBeat() {
    return 60 / this.state.tempo
  }

  getPosition() {
    let { swing, startTime, now } = this.state

    if (startTime === false) return {}

    let totalBeats = (now - startTime) / this.getSecsPerBeat()

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
  }

  getPulseDiff(delta) {
    let { context } = this.props
    let { swing } = this.state
    let { totalPulses } = this.getPosition()

    let now = context.currentTime - delta / 1000
    let secsPerBeat = this.getSecsPerBeat()

    let currPulseDiff =
      (now - this.getPulseStart(totalPulses)) / (secsPerBeat * swing)
    let nextPulseDiff =
      (this.getPulseStart(totalPulses + 1) - now) / (secsPerBeat * (1 - swing))

    return {
      currPulseDiff,
      nextPulseDiff,
    }
  }

  getPulseStart(totalPulses) {
    let { startTime, swing } = this.state

    let totalBeats =
      Math.floor(totalPulses / 2) + (totalPulses % 2 === 0 ? 0 : swing)

    return startTime + totalBeats * this.getSecsPerBeat()
  }

  //

  render() {
    let {
      tempo,
      repeats,
      swing,
      clap1,
      clap2,
      metronome,
      countMetronome,
      startTime,
      now,
      userInput,
    } = this.state
    let { pattern, pulse } = this.getPosition()

    let buttonHandler, buttonLabel
    if (pattern === undefined) {
      buttonHandler = this.handleStart
      buttonLabel = 'Start'
    } else if (pattern < 0) {
      buttonHandler = this.handleStop
      buttonLabel = Math.floor(pulse / 2) + 1
    } else {
      buttonHandler = this.handleStop
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
              onChange={this.handleSetting('tempo', parseInt)}
            />
            <Input
              label="Repeats:"
              type="number"
              min={1}
              max={999}
              step={1}
              value={repeats}
              onChange={this.handleSetting('repeats', parseInt)}
            />
            <Input
              label="Swing:"
              type="number"
              min={0.1}
              max={0.9}
              step={0.01}
              value={swing}
              onChange={this.handleSetting('swing', parseFloat)}
            />
          </fieldset>

          <fieldset>
            <div className="noselect">Sounds:</div>
            <Input
              label="Clap 1"
              type="checkbox"
              checked={clap1}
              onChange={this.handleSetting('clap1')}
            />
            <Input
              label="Clap 2"
              type="checkbox"
              checked={clap2}
              onChange={this.handleSetting('clap2')}
            />
            <Input
              label="Metronome"
              type="checkbox"
              checked={metronome}
              onChange={this.handleSetting('metronome')}
            />
            <Input
              label="Count"
              type="checkbox"
              checked={countMetronome}
              onChange={this.handleSetting('countMetronome')}
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
}

App.propTypes = {}

export default hot(module)(App)
