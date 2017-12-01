import React from 'react'
import cx from 'classnames'

const Action = ({ action, onClick }) => action !== null
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

export default class TripticCard extends React.Component {
  constructor(props) {
    super(props)

    this.handleOpen = this.handleOpen.bind(this)
    this.handleAction = this.handleAction.bind(this)
    this.handleCardAnimationEnd = this.handleCardAnimationEnd.bind(this)
    this.handleLeftAnimationEnd = this.handleLeftAnimationEnd.bind(this)
    this.handleRightAnimationEnd = this.handleRightAnimationEnd.bind(this)
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
    const { state, onDrawn, onDiscarded, onRemoved } = this.props

    if (e.animationName === 'draw') {
      onDrawn()
    } else if (e.animationName === 'discard') {
      onDiscarded()
    } else if (e.animationName === 'remove') {
      onRemoved()
    }
  }

  handleLeftAnimationEnd() {
    const { data, state, onClosed } = this.props

    if (state === 'action-right') {
      if (data.actions.length === 2) {
        onClosed(2, data.actions[1])
      } else if (data.actions.length === 3) {
        onClosed(2, data.actions[2])
      }
    }
  }

  handleRightAnimationEnd() {
    const { data, state, onClosed } = this.props

    if (state === 'action-left') {
      onClosed(0, data.actions[0])
    } else if (state === 'action-center') {
      if (data.actions.length === 1) {
        onClosed(1, data.actions[0])
      } else if (data.actions.length === 3) {
        onClosed(1, data.actions[1])
      }
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

    return <div
      className={cx(
        'card',
        {
          'card-drawing': state === 'drawing',
          'card-closed': state === 'closed',
          'card-open': state === 'open',
          'card-closing-left': state === 'action-left' || state === 'action-center',
          'card-closing-right': state === 'action-right',
          'card-discarding-left': state === 'discarding-left' || state === 'discarding-center',
          'card-discarding-right': state === 'discarding-right',
          'card-removing-left': state === 'removing-left' || state === 'removing-center',
          'card-removing-right': state === 'removing-right',
        }
      )}
      onAnimationEnd={this.handleCardAnimationEnd}
    >
      <div className='card-left'>
        <Action action={actions[0]} onClick={() => this.handleAction(0)} />
      </div>

      <div className='card-center'>
        <div className='card-face card-outside-left'
          onClick={state === 'closed' ? this.handleOpen : null}
          onAnimationEnd={this.handleLeftAnimationEnd}
        >
          <div>{title}</div>
          <div>{data.text}</div>
        </div>

        <div className='card-face card-outside-right' onAnimationEnd={this.handleRightAnimationEnd}>
          OUTSIDE RIGHT
        </div>

        <div className='card-face card-outside-center'>
          OUTSIDE CENTER
        </div>

        <Action action={actions[1]} onClick={state === 'open' ? () => this.handleAction(1) : null} />
      </div>

      <div className='card-right'>
        <Action action={actions[2]} onClick={state === 'open' ? () => this.handleAction(2) : null} />
      </div>
    </div>
  }
}
