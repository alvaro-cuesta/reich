import React from 'react'
import cx from 'classnames'

const Action = ({ action, onClick }) =>
  action !== null
  ? <div className='card-face card-action card-active-action' onClick={onClick} >
      <div className='card-action-row'>
        {action.text}
      </div>

      <div className='card-action-row'>
        {action.cost}
      </div>

      <div className='card-action-row'>
        {action.actions.toString()}
      </div>
    </div>
  : <div className='card-face card-action card-null-action' />

export const BackFace = ({ className, ...props }) =>
  <div
    className={cx(className, 'card-face', 'card-outside-center')}
    {...props}
  >
    OUTSIDE CENTER
  </div>

export default class TripticCard extends React.Component {
  constructor(props) {
    super(props)

    this.handleOpen = this.handleOpen.bind(this)
    this.handleAction = this.handleAction.bind(this)
    this.handleCardAnimationEnd = this.handleCardAnimationEnd.bind(this)
  }

  handleOpen() {
    const { onClickOpen } = this.props
    onClickOpen()
  }

  handleAction(i) {
    const { data, onAction } = this.props

    let actions
    switch (data.actions.length) {
    case 1:
      actions = [null, data.actions[0], null]
      break
    case 2:
      actions = [data.actions[0], null, data.actions[1]]
      break
    case 3:
      actions = data.actions
    }

    onAction(i, actions[i])
  }

  handleCardAnimationEnd(e) {
    const { onEnd } = this.props

    if (e.animationName === 'discard') {
      onEnd('discard')
    } else if (e.animationName === 'remove') {
      onEnd('removed')
    }
  }

  render() {
    const { title, data, state } = this.props

    let actions
    switch (data.actions.length) {
    case 1:
      actions = [null, data.actions[0], null]
      break
    case 2:
      actions = [data.actions[0], null, data.actions[1]]
      break
    case 3:
      actions = data.actions
    }

    const stateClasses = {
      'card-drawing': state === 'drawing',
      'card-open': state === 'open',
      'card-closing-left': state === 'discarding-left' || state === 'discarding-center' || state === 'removing-left' || state === 'removing-center',
      'card-closing-right': state === 'discarding-right' || state === 'removing-right',
      'card-discarding': state === 'discarding-left' || state === 'discarding-center' || state === 'discarding-right',
      'card-removing': state === 'removing-left' || state === 'removing-center' || state === 'removing-right',
    }

    return <div
      className={cx('card-container', stateClasses)}
      onAnimationEnd={this.handleCardAnimationEnd}
    >
      <div className={cx('card', stateClasses)}>
        <div className='card-left'>
          <div className='card-face card-outside-left'
            onClick={state === 'drawing' ? this.handleOpen : null}
          >
            <div>{title}</div>
            <div>{data.text}</div>
          </div>

          <Action action={actions[0]} onClick={() => this.handleAction(0)} />
        </div>

        <div className='card-center'>
          <BackFace />

          <Action action={actions[1]} onClick={state === 'open' ? () => this.handleAction(1) : null} />
        </div>

        <div className='card-right'>
          <div className='card-face card-outside-right'>
            OUTSIDE RIGHT
          </div>

          <Action action={actions[2]} onClick={state === 'open' ? () => this.handleAction(2) : null} />
        </div>
      </div>
    </div>
  }
}
