const plugin = require('../../src/index')
global.cia = require('./../../src/agent')()
require('babel-register')({
  plugins: [plugin]
})

require('./if-statement')
// require('./http-server')
