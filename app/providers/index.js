module.exports = {
  get(providerName) {
    let provider = require('./' + providerName.toLowerCase()) 
    return new provider
  }
};