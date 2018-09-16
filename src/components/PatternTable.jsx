import { smoothScroll, easeOutSine } from '../smoothScroll'

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import cx from 'classnames'

import classes from './PatternTable.cssm'
import styles from './styles.cssm'

import PatternPanel from './PatternPanel'
import ArrowRow from './ArrowRow'
import Pattern from 'components/Pattern'

const SCROLL_DURATION = 300
const SCROLL_EASING = easeOutSine

class PatternTable extends React.PureComponent {
  constructor(props) {
    super(props)

    this.rows = []
  }

  componentDidUpdate({ pattern }) {
    if (this.props.pattern !== pattern) {
      this.scrollToPattern(Math.max(0, this.props.pattern || 0))
    }
  }

  scrollToPattern(i) {
    console.log('scroll', i)
    smoothScroll(
      document.scrollingElement,
      this.rows[i].offsetTop -
        this.scrollAnchor.offsetHeight -
        3 * this.rows[i].offsetHeight,
      SCROLL_DURATION,
      SCROLL_EASING,
    )
  }

  render() {
    let { clapPattern, pattern, pulse, repeats, userInput } = this.props

    let originalPattern = pattern

    if (pattern === undefined || pattern <= 0) pattern = 0

    const rowCount = (clapPattern.length + 1) * repeats

    const patterns = Array(rowCount)
      .fill()
      .map((_, i) => (
        <Pattern
          key={i}
          ref={(e) => (this.rows[i] = ReactDOM.findDOMNode(e))}
          clapPattern={clapPattern}
          highlight={i === pattern}
          highlightPulse={i === pattern ? pulse : undefined}
          shift={Math.floor(i / repeats)}
          userInput={userInput[i]}
          donePattern={i < originalPattern}
          currentPattern={i === originalPattern}
        />
      ))

    return (
      <div
        className={cx(styles.flexColumn, classes.patternTable, 'noselect')}
        style={{ '--pattern': pattern }}
      >
        <PatternPanel className={cx(styles.stickyTop, 'clap1')} head="Clap 1 ➡">
          <div ref={(e) => (this.scrollAnchor = ReactDOM.findDOMNode(e))} />
          <ArrowRow
            length={clapPattern.length}
            highlightPulse={pattern >= -1 ? pulse : undefined}
          />
          <Pattern
            clapPattern={clapPattern}
            shift={0}
            highlight={true}
            highlightPulse={pulse}
          />
        </PatternPanel>
        <PatternPanel className="clap2" head="Clap 2 ➡">
          {patterns}
        </PatternPanel>
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
