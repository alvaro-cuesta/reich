import React from 'react'
import cx from 'classnames'

import classes from './ArrowRow.cssm'
import styles from './styles.cssm'

const ArrowRow = ({ length, highlightPulse }) => (
  <div className={styles.flexRow}>
    {Array(length)
      .fill()
      .map((_, i) => (
        <div
          key={i}
          className={cx('cell', classes.arrow, {
            [classes.highlight]: i === highlightPulse,
          })}
        />
      ))}
  </div>
)

export default ArrowRow
