'use strict';
const DataProvider = require('./base');

class MockProvider extends DataProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'mock';
  }

  async ping() {
    // Mock用: 常に成功
    return true;
  }

  async getQuote(ticker) {
    return {
      ticker,
      price: Math.random() * 100 + 50,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      source: 'mock'
    };
  }

  async getHistorical(ticker, startDate, endDate) {
    // 90日分のダミーデータ
    const data = [];
    const current = new Date(startDate);
    let price = 75;
    
    while (current <= endDate) {
      price += (Math.random() - 0.5) * 5;
      data.push({
        date: current.toISOString().split('T')[0],
        open: price,
        high: price + Math.random() * 5,
        low: price - Math.random() * 5,
        close: price,
        volume: Math.floor(Math.random() * 1000000)
      });
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  }

  async getFinancials(ticker) {
    return {
      ticker,
      market_cap: '5B',
      pe_ratio: 25.5,
      eps: 2.1,
      eps_growth: 15.3,
      source: 'mock'
    };
  }

  async getNews(ticker, limit = 5) {
    return [
      { title: 'Company reports strong Q3 earnings', url: '#', date: new Date().toISOString(), source: 'mock' },
      { title: 'New product launch announced', url: '#', date: new Date().toISOString(), source: 'mock' }
    ].slice(0, limit);
  }
}

module.exports = MockProvider;
