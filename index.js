const asyncHooks = require('async_hooks')

const TCPWRAP_NAME = 'TCPWRAP'
const callstackMap = {} // all callstack map
const TCPWrapCallstackContainers = {} // request root callstack
const DEFAULT_INTERVAL = 10 // remove expired context interval
const DEFAULT_EXPIRE = 150 // callstack expire time (must be longer than full lifecycle of a request)

// remove callstack after request finish/close
const removeCallstackTrigger = rootId => {
  /* istanbul ignore else */
  if (TCPWrapCallstackContainers[rootId]) {
    TCPWrapCallstackContainers[rootId].id.forEach(asyncId => {
      delete callstackMap[asyncId]
    })
    delete TCPWrapCallstackContainers[rootId]
  }
}

// remove asyncId map 60s ago every second
const interval = config => {
  setTimeout(() => {
    interval(config)
  }, config.interval)

  const now = Date.now()

  for (const asyncId of Object.keys(callstackMap)) {
    if (now - callstackMap[asyncId].__tm < config.expire) {
      break
    } else {
      delete callstackMap[asyncId]
    }
  }

  for (const rootId of Object.keys(TCPWrapCallstackContainers)) {
    if (now - TCPWrapCallstackContainers[rootId].__tm < config.expire) {
      break
    } else {
      removeCallstackTrigger(rootId)
    }
  }

  delete callstackMap[asyncHooks.executionAsyncId()]
}

// find callstack root
const findRootId = id => {
  /* istanbul ignore else */
  if (callstackMap[id]) {
    if (callstackMap[id].data) {
      return id
    }
    return findRootId(callstackMap[id].id)
  }
}

// find TCPWrap root
const findTCPWrapAsyncId = asyncId => {
  /* istanbul ignore else */
  if (callstackMap[asyncId]) {
    if (callstackMap[asyncId].isTCP) {
      return asyncId
    }
    return findTCPWrapAsyncId(asyncId - 1)
  }
}

asyncHooks.createHook({
  init (asyncId, type) {
    const executionAsyncId = asyncHooks.executionAsyncId()

    callstackMap[asyncId] = {
      id: executionAsyncId,
      isTCP: type === TCPWRAP_NAME,
      __tm: Date.now()
    }

    const rootId = findRootId(executionAsyncId)
    if (rootId && TCPWrapCallstackContainers[rootId]) {
      TCPWrapCallstackContainers[rootId].id.push(asyncId)
    }
  }
}).enable()

const middleware = (res, config) => {
  const executionAsyncId = asyncHooks.executionAsyncId()
  const rootId = findTCPWrapAsyncId(executionAsyncId)
  callstackMap[rootId].data = {}
  callstackMap[executionAsyncId] = {
    id: rootId,
    __tm: Date.now()
  }

  TCPWrapCallstackContainers[rootId] = {
    id: [executionAsyncId],
    __tm: Date.now()
  }

  if (config.removeAfterFinish) {
    res.on('finish', () => {
      process.nextTick(() => {
        removeCallstackTrigger(rootId)
      })
    })
  }

  if (config.removeAfterClose) {
    res.on('close', () => {
      process.nextTick(() => {
        removeCallstackTrigger(rootId)
      })
    })
  }
}

/* istanbul ignore next */
const getOptions = (options = {}) => {
  return {
    interval: (options.interval || DEFAULT_INTERVAL) * 1000,
    expire: (options.expire || DEFAULT_EXPIRE) * 1000,
    removeAfterFinish: !!options.removeAfterFinish,
    removeAfterClose: !!options.removeAfterClose
  }
}

module.exports = {
  middleware: options => {
    const config = getOptions(options)

    setTimeout(() => {
      interval(config)
    }, config.interval)

    return (req, res, next) => {
      middleware(res, config)
      next()
    }
  },

  koaMiddleware: options => {
    const config = getOptions(options)

    setTimeout(() => {
      interval(config)
    }, config.interval)

    return async (ctx, next) => {
      middleware(ctx.res, config)
      await next()
    }
  },

  set: (key, value) => {
    const rootId = findRootId(asyncHooks.executionAsyncId())
    /* istanbul ignore else */
    if (rootId) {
      const data = Object.prototype.toString.call(key) === '[object Object]' ? key : { [key]: value }
      Object.assign(callstackMap[rootId].data, data)
    }
  },

  get: key => {
    const rootId = findRootId(asyncHooks.executionAsyncId())
    /* istanbul ignore else */
    if (rootId) {
      const { data } = callstackMap[rootId]
      return typeof key === 'undefined' ? data : data[key]
    }
  }
}
