const plugin = require('../src/index')
const babel = require('babel-core')

module.exports = function transform (code) {
  return babel.transform(code, {
    plugins: [plugin]
  }).code
}
