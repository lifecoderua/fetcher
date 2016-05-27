const conf = require('./app/config'), 
  port = process.env.PORT || conf.port,
  http = require('http'),
  fs = require('fs'),
  fetcher = require('./app/fetcher')

var util = require('util');


fetcher.init();

function fetcherResponseWrapper(res) {
  return function fetcherResponse(result) {
    if (result.error) {
      res.writeHead(result.error)
      res.end()
    } else {
      res.writeHead(200, {})
      res.write(result)
      res.end() 
    }    
  }
}


http.createServer((req, res) => {
  fetcher.process(req, fetcherResponseWrapper(res))
}).listen(port)
console.log('Server running at http://127.0.0.1:' + port)

process.on('uncaughtException', (err) => {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
})