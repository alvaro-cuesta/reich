import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import cx from 'classnames'

// Easing fns
// t: current time, b: begInnIng value, c: target value, d: duration

const linearSmooth = (t, b, c, d) => t/d * c + b;
const easeOutCubic = (t, b, c, d) => c*((t=t/d-1)*t*t + 1) + b;
const easeOutSine = (t, b, c, d) => c * Math.sin(t/d * (Math.PI/2)) + b;

const smoothScroll = (element, position, duration, easingFn) => {
  let originalPosition = element.scrollTop;
  let dx = position - element.scrollTop;
  let startTime = performance.now();

  let scroll = () => {
    let dt = performance.now() - startTime;

    if (dt > duration) {
      element.scrollTop = position;
      return;
    }

    element.scrollTop = easingFn(dt, originalPosition, dx, duration);

    requestAnimationFrame(scroll);
  }

  requestAnimationFrame(scroll);
};

const EMPTY_ROWS = 1;
const SCROLL_DURATION = 300;
const SCROLL_EASING = easeOutSine;

class ClapRow extends React.PureComponent {
  render() {
    let {clapPattern, head, shift, highlightPulse, currentPattern, donePattern, userInput, className} = this.props;

    return <div className={`clap-row ${className}`}>
      <div className='head'>{head}</div>
      <div className='pattern'>
        {clapPattern.map((_, i) => {
          let shifted = (i + shift) % clapPattern.length;
          let isClap = clapPattern[shifted];
          let className = `cell pulse ${isClap ? 'clap' : 'silence'} ${i === highlightPulse ? 'highlight' : ''} `;

          let didntHit = userInput === undefined || userInput[i] === undefined;
          let colorClass = didntHit
            ? 'no-hit'
            : (userInput[i] > 2/3)
              ? 'hit-bad'
              : (userInput[i] > 1/3)
                ? 'hit-ok'
                : 'hit-good';

          if (currentPattern) {
            if (i < highlightPulse || (i === highlightPulse && !didntHit)) {
              className += colorClass;
            }
          } else if (donePattern || userInput !== undefined) {
            className += colorClass;
          }

          return <div key={i} className={className} />;
        })}
      </div>
    </div>;
  }
}

ClapRow.defaultProps = {
  head: '',
  shift: 0,
  className: '',
};

export default class PatternTable extends React.PureComponent {
  constructor(props) {
    super(props);

    this.rows = [];
  }

  componentDidMount() {
    this.scrollAnchor.scrollTop = this.rows[0] - this.scrollAnchor.offsetTop  + this.rows[0].offsetHeight;
  }

  componentWillReceiveProps({pattern}) {
    if (this.props.pattern !== pattern) {
      if (pattern === undefined || pattern <= 0) pattern = 0;

      this.scrollToPattern(pattern);
    }
  }

  scrollToPattern(i) {
    smoothScroll(
      document.scrollingElement,
      this.rows[i].offsetTop - this.scrollAnchor.offsetTop + this.rows[i].offsetHeight,
      SCROLL_DURATION,
      SCROLL_EASING
    );
  }

  render() {
    let {buttonHandler, buttonLabel, clapPattern, pattern, pulse, repeats, userInput, className} = this.props;

    let originalPattern = pattern;

    if (pattern === undefined || pattern <= 0) pattern = 0;

    return <div
      className={`pattern-table noselect ${className}`}
      ref={e => this.scrollAnchor = ReactDOM.findDOMNode(e)}
    >
      <div className='arrow-row'>
        <div className='head'>
          <button className='noselect' onClick={buttonHandler}>{buttonLabel}</button>
        </div>
        <div className='pattern'>
          {clapPattern.map((_, i) => {
            return <div key={i} className='cell arrow'>
              {(originalPattern >= -1) && (i === pulse) ? '▼' : ''}
            </div>;
          })}
        </div>
      </div>

      <div className='pattern-clap1'>
        <ClapRow clapPattern={clapPattern} head={'Clap 1 ➡'} shift={0} highlightPulse={pulse} />
      </div>

      <div className='pattern-clap2'>
        {Array.apply(null, {length: EMPTY_ROWS})
          .map((_, i) => <ClapRow key={i}
            ref={e => this.rows[i] = ReactDOM.findDOMNode(e)}
            clapPattern={clapPattern}
            className='empty'
          />
        )}
        {Array.apply(null, {length: (clapPattern.length + 1) * repeats})
          .map((_, i) => <ClapRow key={i}
            ref={e => this.rows[i + EMPTY_ROWS] = ReactDOM.findDOMNode(e)}
            clapPattern={clapPattern}
            className={i === pattern ? 'highlight' : ''}
            highlightPulse={i === pattern ? pulse : undefined}
            head={i === pattern ? 'Clap 2 ➡' : ''}
            shift={Math.floor(i/repeats)}
            userInput={userInput[i]}
            donePattern={i < originalPattern}
            currentPattern={i === originalPattern}
          />
        )}
        <div className='padder'>
          <div className='head' />
          <div className='pattern empty'>
            {clapPattern.map((_, i) => {
              return <div key={i} className='cell pulse' />;
            })}
          </div>
        </div>
      </div>
    </div>;
  }
}

PatternTable.defaultProps = {
  className: '',
}
