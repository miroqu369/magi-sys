'use strict';
const DataProvider = require('./base');
const net = require('net');

/**
 * MooMoo Extended Provider
 * 全機能フル装備版（テクニカル指標、オプション、企業情報等）
 */
class MoomooExtendedProvider extends DataProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'moomoo-extended';
    this.host = config.host || process.env.MOOMOO_HOST || 'localhost';
    this.port = config.port || parseInt(process.env.MOOMOO_PORT || '11111', 10);
    this.apiKey = config.apiKey || process.env.MOOMOO_API_KEY;
  }

  async ping() {
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

  // ========== 1️⃣ 基本データ ==========
  async getQuote(ticker) {
    const data = await this._request('get_quote', { ticker, market: 'US' });
    return {
      ticker,
      price: data.last_price || 0,
      currency: 'USD',
      source: 'moomoo-extended',
      open: data.open,
      high: data.high,
      low: data.low,
      volume: data.volume,
      previousClose: data.previous_close,
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
      pb_ratio: data.pb_ratio,
      debt_to_equity: data.debt_to_equity,
      current_ratio: data.current_ratio,
      quick_ratio: data.quick_ratio,
      roe: data.roe,
      roa: data.roa,
      source: 'moomoo-extended'
    };
  }

  async getNews(ticker, limit = 5) {
    const data = await this._request('get_news', { ticker, limit });
    return (data.news || []).map(n => ({
      title: n.title,
      url: n.url,
      date: n.date,
      source: 'moomoo',
      sentiment: n.sentiment // positive/negative/neutral
    }));
  }

  // ========== 2️⃣ テクニカル指標 ==========
  async getIndicators(ticker, period = 20) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 365*24*60*60*1000); // 1年
    
    const klines = await this.getHistorical(ticker, startDate, endDate);
    const prices = klines.map(k => k.close).reverse();
    
    if (prices.length < period) {
      return { error: 'Insufficient data' };
    }

    return {
      ticker,
      rsi: this.calculateRSI(prices, 14),
      macd: this.calculateMACD(prices),
      bollingerBands: this.calculateBollingerBands(prices, period),
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      sma200: this.calculateSMA(prices, 200),
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      atr: this.calculateATR(klines, 14)
    };
  }

  // ========== 3️⃣ イントラデイデータ ==========
  async getIntradayData(ticker, interval = '1m') {
    // interval: 1m, 5m, 15m, 1h
    const data = await this._request('get_intraday', {
      ticker,
      market: 'US',
      interval
    });
    return data.bars || [];
  }

  async getMinuteBars(ticker) {
    return this.getIntradayData(ticker, '1m');
  }

  async getFiveMinBars(ticker) {
    return this.getIntradayData(ticker, '5m');
  }

  async getFifteenMinBars(ticker) {
    return this.getIntradayData(ticker, '15m');
  }

  async getHourlyBars(ticker) {
    return this.getIntradayData(ticker, '1h');
  }

  // ========== 4️⃣ オプション・先物 ==========
  async getOptionChain(ticker, expirationDate = null) {
    const data = await this._request('get_option_chain', {
      ticker,
      expiration_date: expirationDate
    });
    
    return {
      ticker,
      expirations: data.expirations || [],
      calls: (data.calls || []).map(c => ({
        strike: c.strike,
        bid: c.bid,
        ask: c.ask,
        lastPrice: c.last_price,
        volume: c.volume,
        openInterest: c.open_interest,
        impliedVolatility: c.iv,
        delta: c.delta,
        gamma: c.gamma,
        theta: c.theta,
        vega: c.vega
      })),
      puts: (data.puts || []).map(p => ({
        strike: p.strike,
        bid: p.bid,
        ask: p.ask,
        lastPrice: p.last_price,
        volume: p.volume,
        openInterest: p.open_interest,
        impliedVolatility: p.iv,
        delta: p.delta,
        gamma: p.gamma,
        theta: p.theta,
        vega: p.vega
      }))
    };
  }

  async getFuturesData(ticker) {
    const data = await this._request('get_futures', { ticker });
    return {
      ticker,
      price: data.price,
      high: data.high,
      low: data.low,
      volume: data.volume,
      openInterest: data.open_interest,
      contracts: data.contracts || []
    };
  }

  // ========== 5️⃣ 企業情報拡張 ==========
  async getCompanyInfo(ticker) {
    const data = await this._request('get_company_info', { ticker });
    return {
      ticker,
      name: data.company_name,
      sector: data.sector,
      industry: data.industry,
      country: data.country,
      website: data.website,
      employees: data.employees,
      foundedYear: data.founded_year,
      ceo: data.ceo,
      cfo: data.cfo,
      headquarters: data.headquarters,
      description: data.description,
      source: 'moomoo-extended'
    };
  }

  // ========== 6️⃣ 配当・スプリット情報 ==========
  async getDividends(ticker, years = 5) {
    const data = await this._request('get_dividends', { ticker, years });
    return {
      ticker,
      currentDividendYield: data.current_yield,
      dividendHistory: (data.dividends || []).map(d => ({
        exDate: d.ex_date,
        paymentDate: d.payment_date,
        amount: d.amount,
        frequency: d.frequency
      })),
      nextDividendDate: data.next_ex_date,
      source: 'moomoo-extended'
    };
  }

  async getSplitHistory(ticker, years = 10) {
    const data = await this._request('get_splits', { ticker, years });
    return {
      ticker,
      splits: (data.splits || []).map(s => ({
        date: s.date,
        ratio: s.ratio,
        description: s.description
      })),
      source: 'moomoo-extended'
    };
  }

  // ========== 7️⃣ アナリスト予想 ==========
  async getAnalystEstimates(ticker) {
    const data = await this._request('get_analyst_estimates', { ticker });
    return {
      ticker,
      targetPrice: data.target_price,
      targetHigh: data.target_high,
      targetLow: data.target_low,
      numberOfAnalysts: data.num_analysts,
      ratings: {
        buy: data.buy_count,
        hold: data.hold_count,
        sell: data.sell_count,
        strongBuy: data.strong_buy_count,
        strongSell: data.strong_sell_count
      },
      epsEstimates: {
        current: data.current_eps_estimate,
        nextYear: data.next_year_eps_estimate,
        nextQuarter: data.next_quarter_eps_estimate
      },
      revenueEstimates: {
        current: data.current_revenue_estimate,
        nextYear: data.next_year_revenue_estimate
      },
      source: 'moomoo-extended'
    };
  }

  // ========== 8️⃣ 複数銘柄分析 ==========
  async getMultipleQuotes(tickers) {
    const results = await Promise.all(
      tickers.map(t => this.getQuote(t)
        .then(q => ({ ticker: t, ok: true, data: q }))
        .catch(e => ({ ticker: t, ok: false, error: e.message }))
      )
    );
    return results;
  }

  async getSectorComparison(sector) {
    const data = await this._request('get_sector_stocks', { sector });
    return {
      sector,
      stocks: (data.stocks || []).map(s => ({
        ticker: s.ticker,
        price: s.price,
        change: s.change_pct,
        marketCap: s.market_cap,
        pe: s.pe_ratio
      })),
      performance: data.sector_performance
    };
  }

  async getCorrelationMatrix(tickers) {
    const prices = await Promise.all(
      tickers.map(t => this.getHistorical(t, 
        new Date(Date.now() - 252*24*60*60*1000), 
        new Date()
      ).then(h => ({ ticker: t, prices: h.map(x => x.close) }))
      )
    );

    const correlations = {};
    for (let i = 0; i < tickers.length; i++) {
      correlations[tickers[i]] = {};
      for (let j = 0; j < tickers.length; j++) {
        if (i === j) {
          correlations[tickers[i]][tickers[j]] = 1.0;
        } else {
          correlations[tickers[i]][tickers[j]] = this.calculateCorrelation(
            prices[i].prices,
            prices[j].prices
          );
        }
      }
    }
    return correlations;
  }

  async getBetaValue(ticker, benchmark = '^GSPC') {
    const tickerData = await this.getHistorical(ticker,
      new Date(Date.now() - 252*24*60*60*1000),
      new Date()
    );
    const benchmarkData = await this.getHistorical(benchmark,
      new Date(Date.now() - 252*24*60*60*1000),
      new Date()
    );

    const tickerReturns = this.calculateReturns(tickerData.map(d => d.close));
    const benchmarkReturns = this.calculateReturns(benchmarkData.map(d => d.close));

    return {
      ticker,
      beta: this.calculateBeta(tickerReturns, benchmarkReturns),
      benchmark
    };
  }

  // ========== 9️⃣ リアルタイム機能 ==========
  async subscribeToTicker(ticker, callback) {
    return this._requestStream('subscribe_tick', { ticker }, callback);
  }

  async unsubscribeFromTicker(ticker) {
    return this._request('unsubscribe_tick', { ticker });
  }

  async setAlert(ticker, price, condition = 'above') {
    return this._request('set_alert', { ticker, price, condition });
  }

  async getWatchlist(watchlistId = 'default') {
    const data = await this._request('get_watchlist', { watchlist_id: watchlistId });
    return {
      watchlistId,
      stocks: (data.stocks || []).map(s => ({
        ticker: s.ticker,
        addedDate: s.added_date,
        notes: s.notes
      }))
    };
  }

  async addToWatchlist(ticker, watchlistId = 'default') {
    return this._request('add_to_watchlist', { ticker, watchlist_id: watchlistId });
  }

  // ========== ヘルパー関数 ==========
  calculateRSI(prices, period = 14) {
    const deltas = prices.slice(1).map((p, i) => p - prices[i]);
    const gains = deltas.filter(d => d > 0).reduce((a, b) => a + b, 0) / period;
    const losses = -deltas.filter(d => d < 0).reduce((a, b) => a + b, 0) / period;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA([macdLine], 9)[0];
    return {
      macdLine: parseFloat(macdLine.toFixed(4)),
      signalLine: parseFloat(signalLine.toFixed(4)),
      histogram: parseFloat((macdLine - signalLine).toFixed(4))
    };
  }

  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const sma = this.calculateSMA(prices, period);
    const variance = prices.slice(-period)
      .reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    return {
      upper: parseFloat((sma + stdDev * std).toFixed(2)),
      middle: parseFloat(sma.toFixed(2)),
      lower: parseFloat((sma - stdDev * std).toFixed(2))
    };
  }

  calculateSMA(prices, period) {
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices[0];
    const result = [ema];
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
      result.push(ema);
    }
    return result;
  }

  calculateATR(klines, period = 14) {
    const trs = klines.map((k, i) => {
      if (i === 0) return k.high - k.low;
      const prev = klines[i - 1].close;
      return Math.max(
        k.high - k.low,
        Math.abs(k.high - prev),
        Math.abs(k.low - prev)
      );
    });
    return this.calculateSMA(trs, period);
  }

  calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  calculateBeta(tickerReturns, benchmarkReturns) {
    const covariance = this.calculateCovariance(tickerReturns, benchmarkReturns);
    const benchmarkVariance = this.calculateVariance(benchmarkReturns);
    return covariance / benchmarkVariance;
  }

  calculateCorrelation(prices1, prices2) {
    const returns1 = this.calculateReturns(prices1);
    const returns2 = this.calculateReturns(prices2);
    const covariance = this.calculateCovariance(returns1, returns2);
    const std1 = Math.sqrt(this.calculateVariance(returns1));
    const std2 = Math.sqrt(this.calculateVariance(returns2));
    return covariance / (std1 * std2);
  }

  calculateCovariance(arr1, arr2) {
    const mean1 = arr1.reduce((a, b) => a + b, 0) / arr1.length;
    const mean2 = arr2.reduce((a, b) => a + b, 0) / arr2.length;
    const len = Math.min(arr1.length, arr2.length);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += (arr1[i] - mean1) * (arr2[i] - mean2);
    }
    return sum / len;
  }

  calculateVariance(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  // ========== 内部メソッド ==========
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

  async _requestStream(cmd, params, callback) {
    const client = net.createConnection({ host: this.host, port: this.port });
    
    client.on('connect', () => {
      client.write(JSON.stringify({ cmd, params }));
    });

    client.on('data', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        callback(null, parsed);
      } catch (e) {
        callback(e);
      }
    });

    client.on('error', (err) => {
      callback(err);
    });

    return () => client.destroy();
  }
}

module.exports = MoomooExtendedProvider;
