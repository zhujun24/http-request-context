module.exports = {
  port: 3003,

  sleep: (time = 300) => new Promise(resolve => {
    setTimeout(resolve, time)
  })
}
