import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import classes from './Pattern.cssm'
import styles from './styles.cssm'

const Pattern = ({
  clapPattern,
  shift,
  highlightPulse,
  currentPattern,
  donePattern,
  userInput,
  highlight,
}) => (
  <div
    className={cx(styles.flexRow, classes.pattern, {
      [classes.highlight]: highlight,
    })}
  >
    {clapPattern.map((_, i) => {
      let shifted = (i + shift) % clapPattern.length
      let isClap = clapPattern[shifted]

      let isHit = userInput !== undefined && userInput[i] !== undefined
      let colorClass = !isHit
        ? classes.noHit
        : userInput[i] > 2 / 3
          ? classes.hitBad
          : userInput[i] > 1 / 3
            ? classes.hitOk
            : classes.hitGood

      const isPastPulse = i < highlightPulse || (i === highlightPulse && isHit)

      return (
        <div
          key={i}
          className={cx(
            'cell',
            classes.pulse,
            isClap ? classes.clap : classes.silence,
            {
              [classes.highlight]: i === highlightPulse,
              [colorClass]:
                (currentPattern && isPastPulse) ||
                (!currentPattern && (donePattern || userInput !== undefined)),
            },
          )}
        />
      )
    })}
  </div>
)

Pattern.propTypes = {
  shift: PropTypes.number,
  className: PropTypes.string,
}

Pattern.defaultProps = {
  shift: 0,
  className: '',
}

export default Pattern
