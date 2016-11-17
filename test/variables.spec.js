import unpad from 'unpad'
import test from 'ava'
import expect from 'unexpected'
import transform from '../utils/transform'

test('simple var, let, const', (t) => {
  const source = unpad(`
    var a = 1
    var b = 2;
    const c = 3;
    let d = 4
  `)

  const expected = unpad(`
    var a = 1;
    cia.var(a, "1:0:1:9");
    var b = 2;
    cia.var(b, "2:0:2:10");
    const c = 3;
    cia.var(c, "3:0:3:12");
    let d = 4;
    cia.var(d, "4:0:4:9");
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})

test('destructured no rename', (t) => {
  const source = unpad(`
    let obj = {
      a: 4,
      b: 5
    }
    const {a, b} = obj;
  `)

  const expected = unpad(`
    let obj = {
      a: 4,
      b: 5
    };
    cia.var(obj, "1:0:4:1");
    const { a, b } = obj;
    cia.var(a, "5:7:5:8");
    cia.var(b, "5:10:5:11");
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})

test('destructured with rename', (t) => {
  const source = unpad(`
    let obj = {
      a: 4,
      b: 5
    }
    const {a: renamedA, b:renamedB} = obj;
  `)

  const expected = unpad(`
    let obj = {
      a: 4,
      b: 5
    };
    cia.var(obj, "1:0:4:1");
    const { a: renamedA, b: renamedB } = obj;
    cia.var(renamedA, "5:7:5:18");
    cia.var(renamedB, "5:20:5:30");
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})
