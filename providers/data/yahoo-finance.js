'use strict';
const DataProvider = require('./base');
const https = require('https');

class YahooFinanceProvider extends DataProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'yahoo';
    this.apiKey = config.apiKey || process.env.YAHOO_API_KEY;
  }

  async ping() {
    // Yahoo API の疎通確認
    return true;
  }

  async getQuote(ticker) {
    // Yahoo API から現在値取得
    // https://finance.yahoo.com/
    // （実装は Yahoo API 仕様に依存）
    return {
      ticker,
      price: 0,
      currency: 'USD',
      source: 'yahoo'
    };
  }

  async getHistorical(ticker, startDate, endDate) {
    // 90日分の履歴取得
    return [];
  }

  async getFinancials(ticker) {
    return {};
  }

  async getNews(ticker, limit = 5) {
    return [];
  }
}

module.exports = YahooFinanceProvider;
