/*
 * Core Fetcher  
 */

const Provider = require('./providers').get('Google')

var 
  map = {}

const
 request = require('request'),
 conf = require('./config'),
 mongo = require('mongodb').MongoClient;

function init() {
  mongo.connect(conf.cachePath, (err, database) => {
    if (err) throw err
    db = database
    this.cache = db.collection(conf.cacheBucket) 
  })
  fetchMap();
  setInterval(fetchMap, 10*60*1000);
}

function fetchMap() {
  request.get(conf.proxyMapUrl, function(err, res, body) {
    if (err) {
      setTimeout(fetchMap, 30*1000)
      console.log('Failed to load proxy map')
      return
    }

    map = JSON.parse(body);
  })
}

function processRequest(req, cb) {
  host = req.headers[conf.header].split(':')[0]

  let requestConfig = getRequestConfig(host) 
  let cachePath = host + req.url
  
  this.cache.find({domain_path: cachePath}).limit(1).toArray().then( (data) => {
    item = data.pop()
    if (item) return item.data
         
    if (map == {}) {
      console.log('map is not loaded yet');
      return cb({ error: 404 });
    }
    if (!requestConfig) {
      console.log('unknown domain');
      return cb({ error: 404 });
    } else {
      requestConfig.targetUrl = requestConfig.targetDomain + req.url
    }   
    
    return Provider.fetch(requestConfig)
      .then( (html) => {
        this.cache.findOneAndReplace(
          {domain_path: cachePath}, 
          {domain: host, domain_path: cachePath, data: html, type: 'clean', c_at: new Date()}
          )
        return html 
      })
  })
    .then( (html) => handleTranslate(html, requestConfig) )
    .then( (processedHtml) => cb(processedHtml) )    
}

function handleTranslate(html, requestConfig) {
  return new Promise((resolve, reject) => {
    request.post({
      url: conf.handlerUrl, 
      form: {
        domain: requestConfig.domain,
        subdomain: requestConfig.subdomain,
        html: html
      }}, 
      (err, res, body) => {
        if (err) { reject(err) }
        resolve(JSON.parse(body).html)
      })
  }) 
}

function extractParts(host) {
  return host.split(':')[0].match(/([^.]+)\.?(.*)/).splice(1).filter( function(el){ return el; } );
}

function urlToPath(url, sourceDomain) {
  return [destBase, sourceDomain, (url.match(/^\/(.*)\/.*$/) || [null]).pop()].filter( function(el) { return el; } ).join('/');
}

function getRequestConfig(host) {
  let parts = extractParts(host),
    reqConf = null,
    domain = parts.join('.')
    subdomain = null
  
  reqConf = map[domain]
  if (!reqConf) { 
    domain = parts[parts.length - 1]
    subdomain = parts[parts.length - 2]
    reqConf = map[domain]
  }
  if (!reqConf || !reqConf.subdomains[subdomain || '*']) return null
  
  return {
    domain: domain,
    subdomain: subdomain,
    targetDomain: reqConf.targetUrl,
    sourceLangCode: reqConf.sourceLangCode,
    targetLangCode: reqConf.subdomains[subdomain || '*'].targetLangCode
  }
}

module.exports = {
  init: init,
  process: processRequest,  
} 