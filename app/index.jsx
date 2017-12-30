import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

import App from 'components/App'

import './index.styl'

/*

TODO:

- FIX: Space down should scale with parent container, not viewport
- Make font size scale with viewport somehow
- Fix count 1
- Fix hot reload in css and jsx

- Select start pattern
- Pause/resume?
- Get current position by phase shift instead of delta from start

- DDR Game
  - No game mode (just play)
  - Detect dual hits (as next hit? as wrong current hit?)
  - Adjust % in colors depending on %
  - x position depending on %
  - Calibration? Seems to be off! (might be fixed)
  - FIX: why there's no hit-bad ever?
  - HACK: timeStamp on event assumes DOMHighresTimeStamp which might not be available in all browsers https://developers.google.com/web/updates/2016/01/high-res-timestamps
  - Option to disable colors until end (no-distraction)
  - Mobile clicking?
  - Statistics of fails etc.
  - Clap1 included game mode?

- Custom pattern

*/

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
