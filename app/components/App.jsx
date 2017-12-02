import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { BackFace, default as TripticCard } from 'components/TripticCard'

import { shuffle, count } from '../util'

export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.handleDeckAnimationEnd = this.handleDeckAnimationEnd.bind(this)
    this.handleCardAnimationEnd = this.handleCardAnimationEnd.bind(this)
    this.handleClickOpen = this.handleClickOpen.bind(this)
    this.handleAction = this.handleAction.bind(this)

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
      state: 'moving',
    }
  }

  handleDeckAnimationEnd({ animationName }) {
    let { deck } = this.state

    if (animationName === 'move-deck') {
      const boardCard = deck.pop()
      this.setState({ deck, boardCard, state: 'drawing' })
    }
  }

  handleCardAnimationEnd({ animationName }) {
    let { deck, discard, removed, boardCard } = this.state

    switch (animationName) {
    case 'draw':
      this.setState({ state: 'opening' })
      return
    case 'remove':
      removed.push(boardCard)
      break
    case 'discard':
      discard.push(boardCard)
      break
    default:
      return
    }

    if (deck.length === 0) {
      deck = shuffle(discard)
      discard = []
    }

    this.setState({ deck, discard, removed, boardCard: null, state: 'moving' })
  }

  handleClickOpen() {
    if (state !== 'drawing') return

    this.setState({ state: 'opening' })
  }

  handleAction(i, action) {
    if (state !== 'opening') return

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

    let state
    switch (i) {
    case 0:
      state = `${sendTo}-left`
      break
    case 1:
      state = `${sendTo}-center`
      break
    case 2:
      state = `${sendTo}-right`
    }

    this.setState({ hand, deck, discard, removed, boardCard, state })
  }

  render() {
    const { game } = this.props
    const { globals, hand, deck, discard, removed, boardCard, state } = this.state

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
        <div className={`board state-${state}`}>
          <div className='deck' onAnimationEnd={this.handleDeckAnimationEnd}>
            {
              deck.length > 0
              ? <div className='card-lone'>
                  <BackFace />
                </div>
              : null
            }
          </div>

          <div className='card-container'
            onAnimationEnd={this.handleCardAnimationEnd}
          >
            {
              boardCard !== null
              ? <TripticCard title={boardCard} data={game.cards[boardCard]}
                  state={state}
                  onClickOpen={this.handleClickOpen}
                  onAction={this.handleAction}
                />
              : <div className='card-placeholder-hack' />
            }
          </div>

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
