import { smoothScroll, easeOutSine } from '../smoothScroll'

import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import ClapRow from './ClapRow'

const EMPTY_ROWS = 1
const SCROLL_DURATION = 300
const SCROLL_EASING = easeOutSine
const OVERSCROLL_PX = 4

const PatternTable = ({
  buttonHandler,
  buttonLabel,
  clapPattern,
  pattern,
  pulse,
  repeats,
  userInput,
  className,
}) => {
  const originalPattern = pattern

  if (pattern === undefined || pattern <= 0) pattern = 0

  const rowsRef = useRef([])
  const scrollAnchorRef = useRef(null)

  const scrollToPattern = useCallback((i) => {
    smoothScroll(
      document.scrollingElement,
      rowsRef.current[EMPTY_ROWS + i].offsetTop -
        rowsRef.current[EMPTY_ROWS].offsetTop +
        scrollAnchorRef.current.offsetTop +
        OVERSCROLL_PX,
      SCROLL_DURATION,
      SCROLL_EASING,
    )
  }, [])

  const patternRowsLength = (clapPattern.length + 1) * repeats

  useEffect(() => {
    if (originalPattern !== undefined) {
      scrollToPattern(
        Math.max(0, Math.min(patternRowsLength - 1, originalPattern)),
      )
    }
  }, [originalPattern, scrollToPattern, patternRowsLength])

  return (
    <div
      className={`pattern-table noselect ${className}`}
      ref={(e) => {
        scrollAnchorRef.current = e
      }}
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
        {Array(EMPTY_ROWS)
          .fill()
          .map((_, i) => (
            <ClapRow
              key={i}
              ref={(e) => {
                rowsRef.current[i] = e
              }}
              clapPattern={clapPattern}
              className="empty"
            />
          ))}
        {Array(patternRowsLength)
          .fill()
          .map((_, i) => (
            <ClapRow
              key={i}
              ref={(e) => {
                rowsRef.current[i + EMPTY_ROWS] = e
              }}
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

PatternTable.propTypes = {
  className: PropTypes.string,
}

PatternTable.defaultProps = {
  className: '',
}

export default PatternTable
