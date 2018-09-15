'use strict'

const path = require('path')

const paths = {
  app: path.join(__dirname, 'src'),
  output: path.join(__dirname, 'build'),
}

module.exports = require('@alvaro-cuesta/webpack-parts').spa({
  name: 'Reich Clapping Trainer',
  paths,
  alias: {
    components: path.join(paths.app, 'components'),
  },
})
