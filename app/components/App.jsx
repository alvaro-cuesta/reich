import React from 'react'
import PropTypes from 'prop-types'

import TripticCard from 'components/TripticCard'

import { shuffle, count } from '../util'

export default class App extends React.Component {
  constructor(props) {
    super(props)

    this.handleDrawn = this.handleDrawn.bind(this)
    this.handleClickOpen = this.handleClickOpen.bind(this)
    this.handleAction = this.handleAction.bind(this)
    this.handleClosed = this.handleClosed.bind(this)
    this.handleDiscarded = this.handleDiscarded.bind(this)
    this.handleRemoved = this.handleRemoved.bind(this)

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

  handleDrawn() {
    this.setState({ boardState: 'closed' })
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

    let boardState
    switch (i) {
    case 0:
      boardState = 'action-left'
      break
    case 1:
      boardState = 'action-center'
      break
    case 2:
      boardState = 'action-right'
    }

    this.setState({ hand, deck, discard, removed, boardCard, boardState })
  }

  handleClosed(i, action) {
    let sendTo
    switch (action.actions.send) {
    case 'removed':
      sendTo = 'removing'
      break
    case 'discard':
    default:
      sendTo = 'discarding'
    }

    switch (i) {
    case 0:
      this.setState({ boardState: `${sendTo}-left` })
      break
    case 1:
      this.setState({ boardState: `${sendTo}-center` })
      break
    case 2:
      this.setState({ boardState: `${sendTo}-right` })
    }
  }

  handleDiscarded() {
    let { deck, discard, boardCard } = this.state

    discard.push(boardCard)

    if (deck.length === 0) {
      deck = shuffle(discard)
      discard = []
    }

    boardCard = deck.pop()

    this.setState({ deck, discard, boardCard, boardState: 'drawing' })
  }

  handleRemoved() {
    let { deck, discard, removed, boardCard } = this.state

    removed.push(boardCard)

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
        <div className='card-container'>
          <TripticCard title={boardCard} data={game.cards[boardCard]}
            state={boardState}
            onDrawn={this.handleDrawn}
            onClickOpen={this.handleClickOpen}
            onAction={this.handleAction}
            onClosed={this.handleClosed}
            onDiscarded={this.handleDiscarded}
            onRemoved={this.handleRemoved}
          />
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
