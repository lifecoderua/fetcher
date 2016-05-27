const MAX_REDIRECT_DEPTH = 5
const TIMEOUT = 6000
const TRANSLATION_URL = 'http://translate.google.com/translate?hl=en&sl=%{source_lang_code}&tl=%{result_lang_code}&u=%{url}&prev=hp'

const request = require('request')
const baseRequest = request.defaults({
        gzip: true,
        timeout: TIMEOUT,
        headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' }
      })

class Google {  
  constructor() {}
  
  fetch({targetUrl, sourceLangCode, targetLangCode}) {
    this.depth = 0  
    let providerUrl = TRANSLATION_URL
                      .replace('%{source_lang_code}', sourceLangCode)
                      .replace('%{result_lang_code}', targetLangCode)
                      .replace('%{url}', targetUrl)
        
    let done = new Promise( (resolve) => this.load_and_translate(providerUrl, resolve) )
    return done
  }
  
  // private
  
  load_and_translate(url, resolve) {
    this.depth += 1
    if (this.depth > MAX_REDIRECT_DEPTH) { throw new Error('Max redirect depth is reached') }    
    
    return this.fetch_url(url).then( (html) => {
      let result = this.check(html) 
      return result.redirect ? this.load_and_translate(result.redirect, resolve) : resolve(html)
    })    
  }
  
  fetch_url(url) {
    return new Promise( (resolve, reject) => {
      baseRequest.get(url, (err, res, body) => {
        if (err) reject(err)
        resolve(body)
      })
    })
  }
  
  check(html) {
    let result = (html.match(/<iframe sandbox="allow-same-origin allow-forms allow-scripts" src="(http:\/\/translate.googleusercontent.com\/translate_p\?[^"]+)/) || []).pop()
    if (result) { return { redirect: result.replace(/&amp;/g, '&') } }
    
    result = (html.match(/<meta http-equiv="refresh" content="0;URL=([^"]+)/) || []).pop()
    if (result) { return { redirect: result.replace(/&amp;/g, '&') } }
    
    return { status: ':ok' }
  }
}

module.exports = Google