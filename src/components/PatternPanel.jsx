import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import classes from './PatternPanel.cssm'
import styles from './styles.cssm'

const PatternPanel = ({ className, head, children }) => (
  <div className={cx(styles.flexRow, classes.patternPanel, className)}>
    <div className="heads">
      <div className="head">{head}</div>
    </div>
    <div className={cx('patterns', styles.flexColumn)}>{children}</div>
    <div className="rest" />
  </div>
)

PatternPanel.propTypes = {
  className: PropTypes.string,
  head: PropTypes.string,
  children: PropTypes.arrayOf(PropTypes.node),
}

export default PatternPanel
