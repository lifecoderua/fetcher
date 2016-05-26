/*
 * Core ProxyMul
 * 
 * Proxy files from multiple mapped domains.
 * Mapping:Hash { requestDomain1: proxyDomain1, ... }
 * Entry data: [sub.]domain.dot.com[:port] 
 * Output data: guessed content-type header + file
 *  
 */

const Provider = require('./providers').get('Google')

var map = {}

const http = require('http'),
 https = require('https'),
 fs = require('fs'),
 mime = require('mime-types'),
 path = require('path'),
 conf = require('./config'),
 _ = require('lodash'),
 urlUtils = require('url');

function init() {
  fetchMap();
  setInterval(fetchMap, 10*60*1000);
}

function fetchMap() {
  fetcher(conf.proxyMapUrl).get(conf.proxyMapUrl, function(res) {
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      map = JSON.parse(body);
    });
  }).on('error', function() {
    // retry
    setTimeout(fetchMap, 30*1000);
    console.log('Failed to load proxy map');
  });
}

function processRequest(req, cb) {
    // Request params
  // /* Pattern */ 'http://unix:SOCKET:PATH'
  // /* Example */ request.get('http://unix:/absolute/path/to/unix.socket:/request/path')

  
  Provider.fetch('https://formkeep.com', 'en', 'ru')
    .then( (data) => cb(data) )
  return  
}

function extractParts(host) {
  return host.split(':')[0].match(/([^.]+)\.?(.*)/).splice(1).filter( function(el){ return el; } );
}

function urlToPath(url, sourceDomain) {
  return [destBase, sourceDomain, (url.match(/^\/(.*)\/.*$/) || [null]).pop()].filter( function(el) { return el; } ).join('/');
}

function getSourceDomain(host) {
  var parts = extractParts(host);
  return checkMappedDomain(parts[parts.length - 1]) || checkMappedDomain(parts.join('.')) || null; 
}

function checkMappedDomain(domain) {
  return map[domain] ? domain : null;
}

module.exports = {
  init: init,
  process: processRequest,  
} 