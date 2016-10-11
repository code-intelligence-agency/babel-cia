import unpad from 'unpad'
import test from 'ava'
import expect from 'unexpected'
import transform from '../utils/transform'

test((t) => {
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
        cia.method([], "3:2:5:3")
        return cia.return(1, "4:11:4:12");;
      },
      set setter(val) {
        cia.method([val], "6:2:8:3")

        value = val;
      }
    };
    cia.var(a, "2:0:9:1");
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})

test((t) => {
  const source = unpad(`
    c({
      get getter() {
        return 2
      },
      set setter(val) {
        value = val
      }
    })
  `)

  const expected = unpad(`
  c({
    get getter() {
      cia.method([], "2:2:4:3")
      return cia.return(2, "3:11:3:12");;
    },
    set setter(val) {
      cia.method([val], "5:2:7:3")

      value = val;
      cia.var(value, "6:4:6:15");
    }
  });
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})
