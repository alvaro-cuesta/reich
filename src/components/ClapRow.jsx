import React from 'react'
import PropTypes from 'prop-types'

const ClapRow = React.forwardRef(
  (
    {
      clapPattern,
      head,
      shift,
      highlightPulse,
      currentPattern,
      donePattern,
      userInput,
      className,
    },
    ref,
  ) => (
    <div ref={ref} className={`clap-row ${className}`}>
      <div className="head">{head}</div>
      <div className="pattern">
        {clapPattern.map((_, i) => {
          const shifted = (i + shift) % clapPattern.length
          const isClap = clapPattern[shifted]
          let className = `cell pulse ${isClap ? 'clap' : 'silence'} ${
            i === highlightPulse ? 'highlight' : ''
          } `

          const didntHit = userInput === undefined || userInput[i] === undefined
          const colorClass = didntHit
            ? 'no-hit'
            : userInput[i] > 2 / 3
            ? 'hit-bad'
            : userInput[i] > 1 / 3
            ? 'hit-ok'
            : 'hit-good'

          if (currentPattern) {
            if (i < highlightPulse || (i === highlightPulse && !didntHit)) {
              className += colorClass
            }
          } else if (donePattern || userInput !== undefined) {
            className += colorClass
          }

          return <div key={i} className={className} />
        })}
      </div>
    </div>
  ),
)

ClapRow.propTypes = {
  head: PropTypes.string,
  shift: PropTypes.number,
  className: PropTypes.string,
}

ClapRow.defaultProps = {
  head: '',
  shift: 0,
  className: '',
}

export default ClapRow
