import React from 'react'
import ReactDOM from 'react-dom'

import App from 'components/App'

import './index.scss'

let context = new AudioContext()

window.onload = () => window.scrollTo(0, 0)

ReactDOM.render(<App context={context} />, document.getElementById('container'))
