import unpad from 'unpad'
import test from 'ava'
import expect from 'unexpected'

const plugin = require('../src/index')
const babel = require('babel-core')

function transform (code) {
  return babel.transform(code, {
    plugins: [plugin]
  }).code
}

test((t) => {
  const source = unpad(`
    var a = 10
    var b = 1;
  `)

  const expected = unpad(`
    var a = 10;
    cia.var(a, "1:0:1:10");
    var b = 1;
    cia.var(b, "2:0:2:10");
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})


test((t) => {
  const source = unpad(`
    function foo(c) {
      var a = 10
      a = 5
      a++
      a--
      --a
      ++a
      return a+1
    }
  `)

  const expected = unpad(`
    function foo(c) {
      cia.func([c], "1:9:1:12")

      var a = 10;
      cia.var(a, "2:2:2:12");
      a = 5;
      cia.var(a, "3:2:3:7");
      a++;
      cia.var(a, "4:2:4:3");
      a--;
      cia.var(a, "5:2:5:3");
      --a;
      cia.var(a, "6:4:6:5");
      ++a;
      cia.var(a, "7:4:7:5");
      return cia.return(a+1, "8:9:8:12");;
    }
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})
