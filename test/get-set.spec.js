import unpad from 'unpad'
import test from 'ava'
import expect from 'unexpected'
import transform from '../utils/transform'

test.skip((t) => {
  const source = unpad(`
    let value
    const a = {
      get getter() {
        return 1
      },
      set setter(val) {
        value = val
      }
    }
  `)

  const expected = unpad(`
    let value;
    cia.var(value, "1:0:1:9");
    const a = {
      get getter() {
        cia.getter();
        return 1;
      },
      set setter(val) {
        cia.setter(val, "")
        value = val;
        cia.var(value, "1:0:1:10");
      }
    };
    cia.var(a, "2:0:9:1");
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})
