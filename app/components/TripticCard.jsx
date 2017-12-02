import React from 'react'
import cx from 'classnames'

export const Action = ({ action, onClick }) =>
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

export const TripticCard = ({ title, data, state, onClickOpen, onAction }) => {
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

  return <div className='card'>
    <div className='card-left'>
      <div className='card-face card-outside-left'
        onClick={state === 'drawing' ? onClickOpen : null}
      >
        <div>{title}</div>
        <div>{data.text}</div>
      </div>

      <Action action={actions[0]} onClick={() => onAction(0, actions[0])} />
    </div>

    <div className='card-center'>
      <BackFace />

      <Action action={actions[1]} onClick={() => onAction(1, actions[1])} />
    </div>

    <div className='card-right'>
      <div className='card-face card-outside-right'>
        OUTSIDE RIGHT
      </div>

      <Action action={actions[2]} onClick={() => onAction(2, actions[2])} />
    </div>
  </div>
}

export default TripticCard
