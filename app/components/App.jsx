import React from 'react'
import PropTypes from 'prop-types'

import TripticCard from 'components/TripticCard'

import { shuffle, count } from '../util'

export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.handleClickOpen = this.handleClickOpen.bind(this)
    this.handleAction = this.handleAction.bind(this)
    this.handleEnd = this.handleEnd.bind(this)

    const { game } = this.props
    const globals = {}, hand = [], deck = [], discard = [], removed = []

    game.start(globals, hand, deck, discard, removed)

    const boardCard = deck.pop()

    this.state = {
      globals,
      hand,
      deck,
      discard,
      removed,
      boardCard,
      boardState: 'drawing',
    }
  }

  handleClickOpen() {
    this.setState({ boardState: 'open' })
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

    boardCard = deck.pop()

    this.setState({ deck, discard, removed, boardCard, boardState: 'drawing' })
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
        <TripticCard title={boardCard} data={game.cards[boardCard]}
          state={boardState}
          onClickOpen={this.handleClickOpen}
          onAction={this.handleAction}
          onEnd={this.handleEnd}
        />

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
