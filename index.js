const asyncHooks = require('async_hooks')

const contexts = {}
const rootAsyncIdQueueMap = {}
const INTERVAL = 1000
const ID_TIMEOUT = 60000

// delete asyncId map 60s ago every second
const interval = () => {
  setTimeout(interval, INTERVAL)
  const now = Date.now()
  Object.keys(contexts).forEach((id, index) => {
    // skip first TCPWRAP asyncId
    if (index && now - contexts[id].__tm > ID_TIMEOUT) {
      delete contexts[id]
    }
  })
}
setTimeout(interval, INTERVAL)

const findRootId = (id) => {
  if (!id) {
    return
  }
  if (contexts[id]) {
    if (contexts[id].data) {
      return id
    }
    return findRootId(contexts[id].id)
  }
}

const removeAsyncId = id => {
  Object.keys(contexts).forEach(cacheId => {
    if (contexts[cacheId].id === id) {
      delete contexts[cacheId]
      removeAsyncId(cacheId)
    }
  })
}

asyncHooks.createHook({
  init (asyncId, type, triggerAsyncId) {
    contexts[asyncId] = {
      id: asyncHooks.executionAsyncId(),
      __tm: Date.now()
    }

    if (type === 'TCPWRAP') {
      // app start rootId
      rootAsyncIdQueueMap[asyncId] = []
    }

    const rootID = findRootId(asyncId)
    if (rootID) {
      rootAsyncIdQueueMap[rootID].push(asyncId)
    }
  },
  destroy (asyncId) {
    if (rootAsyncIdQueueMap[asyncId]) {
      delete contexts[asyncId]
      rootAsyncIdQueueMap[asyncId].forEach(id => {
        delete contexts[id]
      })
      delete rootAsyncIdQueueMap[asyncId]
    }
    if (!findRootId(asyncId)) {
      delete contexts[asyncId]
    }
  }
}).enable()

module.exports = {
  middleware: (req, res, next) => {
    const executionAsyncId = asyncHooks.executionAsyncId()
    contexts[executionAsyncId].data = {}
    rootAsyncIdQueueMap[executionAsyncId] = []
    next()
  },
  set: (key, value) => {
    const rootId = findRootId(asyncHooks.executionAsyncId())
    if (rootId) {
      Object.assign(contexts[rootId].data, { [key]: value })
    }
  },
  get: (key) => {
    const rootId = findRootId(asyncHooks.executionAsyncId())
    if (rootId) {
      return contexts[rootId].data[key]
    }
  }
}
