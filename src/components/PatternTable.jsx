import { smoothScroll, easeOutSine } from '../smoothScroll'

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import ClapRow from './ClapRow'

const EMPTY_ROWS = 1
const SCROLL_DURATION = 300
const SCROLL_EASING = easeOutSine

class PatternTable extends React.PureComponent {
  constructor(props) {
    super(props)

    this.rows = []
  }

  componentDidMount() {
    this.scrollAnchor.scrollTop =
      this.rows[0] - this.scrollAnchor.offsetTop + this.rows[0].offsetHeight - 4
  }

  componentWillReceiveProps({ pattern }) {
    if (this.props.pattern !== pattern) {
      if (pattern === undefined || pattern <= 0) pattern = 0

      this.scrollToPattern(pattern)
    }
  }

  scrollToPattern(i) {
    smoothScroll(
      document.scrollingElement,
      this.rows[i].offsetTop -
        this.scrollAnchor.offsetTop +
        this.rows[i].offsetHeight -
        /* HACK */ 4,
      SCROLL_DURATION,
      SCROLL_EASING,
    )
  }

  render() {
    let {
      buttonHandler,
      buttonLabel,
      clapPattern,
      pattern,
      pulse,
      repeats,
      userInput,
      className,
    } = this.props

    let originalPattern = pattern

    if (pattern === undefined || pattern <= 0) pattern = 0

    return (
      <div
        className={`pattern-table noselect ${className}`}
        ref={(e) => (this.scrollAnchor = ReactDOM.findDOMNode(e))}
      >
        <div className="arrow-row">
          <div className="head">
            <button className="noselect" onClick={buttonHandler}>
              {buttonLabel}
            </button>
          </div>
          <div className="pattern">
            {clapPattern.map((_, i) => (
              <div key={i} className="cell arrow">
                {originalPattern >= -1 && i === pulse ? '▼' : ''}
              </div>
            ))}
          </div>
        </div>

        <div className="pattern-clap1">
          <ClapRow
            clapPattern={clapPattern}
            head={'Clap 1 ➡'}
            shift={0}
            highlightPulse={pulse}
          />
        </div>

        <div className="pattern-clap2">
          {Array.apply(null, { length: EMPTY_ROWS }).map((_, i) => (
            <ClapRow
              key={i}
              ref={(e) => {
                this.rows[i] = e
              }}
              clapPattern={clapPattern}
              className="empty"
            />
          ))}
          {Array.apply(null, {
            length: (clapPattern.length + 1) * repeats,
          }).map((_, i) => (
            <ClapRow
              key={i}
              ref={(e) => (this.rows[i + EMPTY_ROWS] = ReactDOM.findDOMNode(e))}
              clapPattern={clapPattern}
              className={i === pattern ? 'highlight' : ''}
              highlightPulse={i === pattern ? pulse : undefined}
              head={i === pattern ? 'Clap 2 ➡' : ''}
              shift={Math.floor(i / repeats)}
              userInput={userInput[i]}
              donePattern={i < originalPattern}
              currentPattern={i === originalPattern}
            />
          ))}
          <div className="padder">
            <div className="head" />
            <div className="pattern empty">
              {clapPattern.map((_, i) => {
                return <div key={i} className="cell pulse" />
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

PatternTable.propTypes = {
  className: PropTypes.string,
}

PatternTable.defaultProps = {
  className: '',
}

export default PatternTable
