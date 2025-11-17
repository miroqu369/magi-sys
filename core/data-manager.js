'use strict';

class DataManager {
  constructor() {
    this.providers = {};
    this.active = null;
  }

  register(name, ProviderClass, config) {
    this.providers[name] = new ProviderClass(config);
    console.log(`✓ Provider registered: ${name}`);
    
    if (!this.active) {
      this.active = name;
    }
  }

  use(name) {
    if (!this.providers[name]) {
      throw new Error(`Provider '${name}' not registered`);
    }
    this.active = name;
    console.log(`✓ Active provider: ${name}`);
  }

  async getQuoteMulti(ticker, providerNames = null) {
    const targets = providerNames || Object.keys(this.providers);
    const promises = targets.map(name =>
      this.providers[name].getQuote(ticker)
        .then(data => ({ provider: name, ok: true, data }))
        .catch(err => ({ provider: name, ok: false, error: err.message }))
    );
    return Promise.all(promises);
  }

  async getQuote(ticker) {
    return this.providers[this.active].getQuote(ticker);
  }

  async getHistorical(ticker, startDate, endDate) {
    return this.providers[this.active].getHistorical(ticker, startDate, endDate);
  }

  async getFinancials(ticker) {
    return this.providers[this.active].getFinancials(ticker);
  }

  async getNews(ticker, limit = 5) {
    return this.providers[this.active].getNews(ticker, limit);
  }

  async status() {
    const checks = await Promise.all(
      Object.entries(this.providers).map(([name, provider]) =>
        provider.ping()
          .then(() => ({ name, ok: true }))
          .catch(err => ({ name, ok: false, error: err.message }))
      )
    );
    return {
      active: this.active,
      providers: checks
    };
  }
}

module.exports = DataManager;
