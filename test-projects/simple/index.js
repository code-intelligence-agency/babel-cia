const plugin = require('../../src/index')

require('babel-register')({
  plugins: [plugin]
})

global.cia = require('./../../src/agent')

require('./if-statement')
