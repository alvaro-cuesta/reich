import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { BackFace, default as TripticCard } from 'components/TripticCard'

import { shuffle, count } from '../util'

export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.handleDeckAnimation = this.handleDeckAnimation.bind(this)
    this.handleClickOpen = this.handleClickOpen.bind(this)
    this.handleAction = this.handleAction.bind(this)
    this.handleEnd = this.handleEnd.bind(this)

    const { game } = this.props
    const globals = {}, hand = [], deck = [], discard = [], removed = []

    game.start(globals, hand, deck, discard, removed)

    this.state = {
      globals,
      hand,
      deck,
      discard,
      removed,
      boardCard: null,
      boardState: 'moving',
    }
  }

  handleClickOpen() {
    this.setState({ boardState: 'open' })
  }

  handleDeckAnimation({ animationName }) {
    let { deck } = this.state

    if (animationName === 'move-deck') {
      const boardCard = deck.pop()
      this.setState({ deck, boardCard, boardState: 'drawing' })
    }
  }

  handleAction(i, action) {
    let { hand, deck, discard, removed, boardCard } = this.state

    if (typeof action.cost !== 'undefined' && action.cost.length > 0) {
      for (let resource of action.cost) {
        hand[resource]--
      }
    }

    let sendTo
    switch (action.actions.send) {
    case 'removed':
      sendTo = 'removing'
      break
    case 'discard':
    default:
      sendTo = 'discarding'
    }

    let boardState
    switch (i) {
    case 0:
      boardState = `${sendTo}-left`
      break
    case 1:
      boardState = `${sendTo}-center`
      break
    case 2:
      boardState = `${sendTo}-right`
    }

    this.setState({ hand, deck, discard, removed, boardCard, boardState })
  }

  handleEnd(sendTo) {
    let { deck, discard, removed, boardCard } = this.state

    switch (sendTo) {
    case 'removed':
      removed.push(boardCard)
      break
    default:
    case 'discard':
      discard.push(boardCard)
    }

    if (deck.length === 0) {
      deck = shuffle(discard)
      discard = []
    }

    this.setState({ deck, discard, removed, boardCard: null, boardState: 'moving' })
  }

  render() {
    const { game } = this.props
    const { globals, hand, deck, discard, removed, boardCard, boardState } = this.state

    const resourceCount = count(hand)

    const handResources = Object.keys(game.resources).map(k =>
      <span key={k} title={game.resources[k]}>
        {k}: {resourceCount[k] || 0}
      </span>
    )

    return <div>
      <header>
        <h1>{game.title}</h1>
        <h2>{game.subtitle}</h2>
      </header>

      <main>
        <div className={cx(
            'board',
            {
              'board-moving': boardState === 'moving',
              'board-drawing': boardState === 'drawing',
            }
          )}
        >
          <div className='deck' onAnimationEnd={this.handleDeckAnimation}>
            {
              deck.length > 0
              ? <div className='card-lone'>
                  <BackFace />
                </div>
              : null
            }
          </div>

          {
            boardCard !== null
            ? <TripticCard title={boardCard} data={game.cards[boardCard]}
                state={boardState}
                onClickOpen={this.handleClickOpen}
                onAction={this.handleAction}
                onEnd={this.handleEnd}
              />
            : <div className='card-placeholder-hack' />
          }

          <div className='discard'>
            {
              discard.length > 0
              ? <div className='card-lone'>
                  <BackFace />
                </div>
              : null
            }
          </div>
        </div>

        <div>
          {handResources}
        </div>
      </main>
    </div>
  }
}

App.propTypes = {
}

App.childContextTypes = {
}
