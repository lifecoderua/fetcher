module.exports = {
  port: 5050,
  header: 'host',
  cachePath: 'mongodb://localhost:27017/proxy_translate',
  cacheBucket: 'db_caches',
  proxyMapUrl: process.env.PROXY_MAP || 'http://localhost/api/v0/domains/map',
  // Request params
  // /* Pattern */ 'http://unix:SOCKET:PATH'
  // /* Example */ request.get('http://unix:/absolute/path/to/unix.socket:/request/path')
  handlerUrl: process.env.PROXY_MAP || 'http://localhost/api/v0/process/google'
};