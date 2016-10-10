import unpad from 'unpad'
import test from 'ava'
import expect from 'unexpected'
import transform from '../utils/transform'

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
