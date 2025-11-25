'use strict';
const DataProvider = require('./base');
const net = require('net');

class MoomooProvider extends DataProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'moomoo';
    this.host = config.host || process.env.MOOMOO_HOST || 'localhost';
    this.port = config.port || parseInt(process.env.MOOMOO_PORT || '11111', 10);
    this.apiKey = config.apiKey || process.env.MOOMOO_API_KEY;
  }

  async ping() {
    // OpenD への接続確認
    return new Promise((resolve, reject) => {
      const client = net.createConnection({ host: this.host, port: this.port });
      client.on('connect', () => {
        client.destroy();
        resolve(true);
      });
      client.on('error', reject);
      setTimeout(() => {
        client.destroy();
        reject(new Error('Timeout'));
      }, this.timeout);
    });
  }

  async getQuote(ticker) {
    // OpenD に quote リクエスト
    const data = await this._request('get_quote', { ticker, market: 'US' });
    return {
      ticker,
      price: data.last_price || 0,
      currency: 'USD',
      source: 'moomoo',
      ...data
    };
  }

  async getHistorical(ticker, startDate, endDate) {
    const data = await this._request('get_kline', {
      ticker,
      market: 'US',
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
    return data.klines || [];
  }

  async getFinancials(ticker) {
    const data = await this._request('get_financial', { ticker });
    return {
      ticker,
      market_cap: data.market_cap,
      pe_ratio: data.pe_ratio,
      eps: data.eps,
      eps_growth: data.eps_growth,
      source: 'moomoo'
    };
  }

  async getNews(ticker, limit = 5) {
    const data = await this._request('get_news', { ticker, limit });
    return (data.news || []).map(n => ({
      title: n.title,
      url: n.url,
      date: n.date,
      source: 'moomoo'
    }));
  }

  async _request(cmd, params) {
    return new Promise((resolve, reject) => {
      const client = net.createConnection({ host: this.host, port: this.port });
      let response = '';

      client.on('connect', () => {
        client.write(JSON.stringify({ cmd, params }));
      });

      client.on('data', (data) => {
        response += data.toString();
      });

      client.on('end', () => {
        try {
          resolve(JSON.parse(response));
        } catch (e) {
          reject(new Error(`Parse error: ${response}`));
        }
      });

      client.on('error', reject);

      setTimeout(() => {
        client.destroy();
        reject(new Error(`Request timeout for ${cmd}`));
      }, this.timeout);
    });
  }
}

module.exports = MoomooProvider;
