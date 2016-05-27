# Translation Fetcher

A barebones Node.js app designed to fetch translations and pass them through a handler.

NodeJS v6 with its native ES6 support utilized. 

### Domains map schema

Expected to be provided as a static or dynamic response, containing domains, subdomains and corresponding land code pairs.

Use `null` subdomain name in order to set no-subdomain target langcode.

```
{
<hostname>: { targetUrl: '', subdomains: [{name: ''|null, targetLangCode: ''}], sourceLangCode: '' },
...
}
```

### Data handler schema

Expected to be passed as a data about domain and subdomain involved, as well as the fetched data itself

```
POST { domain: '', subdomain: ''|null, html: '' }
  => handledData
```
