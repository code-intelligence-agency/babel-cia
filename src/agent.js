global.Promise = require('bluebird')
const NodeGit = require('nodegit')
Promise.onPossiblyUnhandledRejection(function(error){
  throw error
})
const co = require('co')

const path = require('path')
const pathToRepo = './'
const os = require('os')
const io = require('socket.io-client')

const shaPromise = co(function* () {
  const repo = yield NodeGit.Repository.open(path.resolve(pathToRepo))
  const headCommit = yield repo.getHeadCommit()
  return headCommit.sha()  
})
const hostname = os.hostname()


module.exports = (socketUrl) => {
  const client = io.connect(`${socketUrl}&started=${new Date()}`);
  return {
    var: (value, location) => {
      console.log(value, location)
      shaPromise.then((sha) => {
        client.emit('var', {
          hostname, sha, value, location
        })
      })
    },
    func: (value, location) => {
      shaPromise.then((sha) => {
        client.emit('func', {
          hostname, sha, value, location
        })
      })
    },
    method: (value, location) => {
      shaPromise.then((sha) => {
        client.emit('method', {
          hostname, sha, value, location
        })
      })
    },
    return: (value, location) => {
      shaPromise.then((sha) => {
        client.emit('return', {
          hostname, sha, value, location
        })
      })
    },
  }
}