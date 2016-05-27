/*
 * Core Fetcher  
 */

const Provider = require('./providers').get('Google')

var map = {}

const
 request = require('request'),
 conf = require('./config');

function init() {
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
  let requestConfig = getRequestConfig(req.headers[conf.header])  
  
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
  
  Provider.fetch(requestConfig)
    .then( (html) => handleTranslate(html, requestConfig) )
    .then( (processedHtml) => cb(processedHtml) )
  return  
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
  if (!reqConf || !reqConf.subdomains[subdomain || 0]) return null
  
  return {
    domain: domain,
    subdomain: subdomain,
    targetDomain: reqConf.targetUrl,
    sourceLangCode: reqConf.sourceLangCode,
    targetLangCode: reqConf.subdomains[subdomain || 0].targetLangCode
  }
}

module.exports = {
  init: init,
  process: processRequest,  
} 