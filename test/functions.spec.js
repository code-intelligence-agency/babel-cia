import unpad from 'unpad'
import test from 'ava'
import expect from 'unexpected'
import transform from '../utils/transform'

test((t) => {
  const source = unpad(`
    const foo = (c) => {
      return c++
    }
  `)

  const expected = unpad(`
    const foo = c => {
      cia.func([c], "1:12:3:1")
      return cia.return(c++, "2:9:2:12");;
    };
    cia.var(foo, "1:0:3:1");
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
      cia.func([c], "1:0:9:1")

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

test((t) => {
  const source = unpad(`
    function foo(c) {
      if (c === 0) {
        return c
      }
    }
  `)

  const expected = unpad(`
    function foo(c) {
      cia.func([c], "1:0:5:1")

      if (c === 0) {
        return cia.return(c, "3:11:3:12");;
      }
    }
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})

test((t) => {
  const source = unpad(`
    function foo({c, d}) {
      return c + d
    }
  `)

  const expected = unpad(`
    function foo({ c, d }) {
      cia.func([[c,d]], "1:0:3:1")
      return cia.return(c + d, "2:9:2:14");;
    }
  `)
  const result = transform(source)
  expect(result, 'to be', expected)
})