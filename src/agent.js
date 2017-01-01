const ciaSerializer = require('cia-serializer')
const util = require('util')
const fetch = require('node-fetch')
const getCallerFile = require('get-caller-file')
const childProcess = require('mz/child_process')

process.on('unhandledRejection', err => {
  if (process.env.NODE_ENV !== 'production') {
    if (!(err instanceof Error)) {
      err = new Error(`Promise rejected with value: ${util.inspect(err)}`)
    }

    console.error(err.message)
    console.error(err.stack)
    process.exit(1)
  }
})

const co = require('co')
const path = require('path')
const os = require('os')
const hostname = os.hostname()
const pathToRepo = path.resolve('./')

const post = (url, body) => {
  if (typeof body !== 'string') {
    body = JSON.stringify(body)
  }
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body
  }).then((res) => res.json())
}

function getFileRelativePath () {
  return path.relative(pathToRepo, getCallerFile())
}

function getSha () {
  return childProcess.exec('git rev-parse HEAD', {
    cwd: pathToRepo
  }).then((result) => {
    return result[0].replace('\n', '')
  })
}

module.exports = (daemonUrl) => {
  daemonUrl = daemonUrl || 'http://localhost:5080'
  let eventCounter = 0
  const sessionPromise = co(function* () {
    const sha = yield getSha()
    // todo send patchfile if git has changes
    return post(daemonUrl + '/run', {
      sha,
      hostname,
      localPath: pathToRepo
    })
  })

  const send = function (evName, data) {
    eventCounter += 1
    data.ordinal = eventCounter
    console.log('send', evName, data)
    sessionPromise.then((run) => {
      data.run = run.key
      const json = ciaSerializer.stringify(data)
      console.log('json: ', json)
      return post(daemonUrl + '/' + run.id + '/event', json).catch(function (err) {
        console.warn(err)
      })
    })
  }

  return {
    var (value, location) {
      const file = getFileRelativePath()
      send('var', {
        type: 'var',
        value,
        location,
        file
      })
    },
    func (value, location) {  // function invocation
      const file = getFileRelativePath()
      send('func', {
        type: 'func',
        value,
        location,
        file
      })
    },
    method (value, location) {
      const file = getFileRelativePath()
      send('method', {
        type: 'method',
        value,
        location,
        file
      })
    },
    return (value, location) {
      const file = getFileRelativePath()
      send('return', {
        type: 'return',
        value,
        location,
        file
      })
      return value
    }
  }
}
