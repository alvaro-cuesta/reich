import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import App from 'components/App'

import './index.styl'

let context = new AudioContext();

ReactDOM.render(
  <AppContainer>
    <App context={context} />
  </AppContainer>,
  document.getElementById('container')
)

if (module.hot) {
  module.hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default

    ReactDOM.render(
      <AppContainer>
        <App context={context} />
      </AppContainer>,
      document.getElementById('container')
    )
  })
}
