import React from 'react'
import ReactDOM from 'react-dom'

import App from 'components/App'

import './index.scss'

let context = new AudioContext()

ReactDOM.render(<App context={context} />, document.getElementById('container'))
