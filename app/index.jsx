import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import './index.styl'

import { deepMap } from './util'

import App from 'components/App'
import game from './game'

ReactDOM.render(
  <AppContainer>
    <App game={game} />
  </AppContainer>,
  document.getElementById('container')
)

if (module.hot) {
  module.hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default
    const nextGame = require('./game').default

    ReactDOM.render(
      <AppContainer>
        <NextApp game={nextGame} />
      </AppContainer>,
      document.getElementById('container')
    )
  })

  module.hot.accept('./game', () => {
    const NextApp = require('./components/App').default
    const nextGame = require('./game').default

    ReactDOM.render(
      <AppContainer>
        <NextApp game={nextGame} />
      </AppContainer>,
      document.getElementById('container')
    )
  })
}
