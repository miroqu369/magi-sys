'use strict';

class DataProvider {
  constructor(config = {}) {
    this.name = 'base';
    this.timeout = config.timeout || 5000;
    this.cache = config.cache || null;
  }

  async ping() {
    throw new Error('ping() not implemented');
  }

  async getQuote(ticker) {
    // Returns: { ticker, price, currency, timestamp, source }
    throw new Error('getQuote() not implemented');
  }

  async getHistorical(ticker, startDate, endDate) {
    // Returns: [{ date, open, high, low, close, volume }, ...]
    throw new Error('getHistorical() not implemented');
  }

  async getFinancials(ticker) {
    // Returns: { ticker, eps, pe_ratio, market_cap, ... }
    throw new Error('getFinancials() not implemented');
  }

  async getNews(ticker, limit = 5) {
    // Returns: [{ title, url, date, source }, ...]
    throw new Error('getNews() not implemented');
  }
}

module.exports = DataProvider;
