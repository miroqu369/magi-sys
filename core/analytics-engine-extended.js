'use strict';

class AnalyticsEngineExtended {
  constructor(dataManager) {
    this.data = dataManager;
  }

  // 基本的な stock analysis
  async analyzeStock(ticker, opts = {}) {
    try {
      let quote, historicals, financials, news;
      const currentProvider = this.data.active;
      
      try {
        quote = await this.data.getQuote(ticker);
      } catch (e) {
        console.warn(`Primary provider (${currentProvider}) failed for quote: ${e.message}`);
        if (currentProvider !== 'mock') {
          console.log('Falling back to mock provider...');
          this.data.use('mock');
          quote = await this.data.getQuote(ticker);
        } else {
          throw e;
        }
      }

      try {
        const endDate = new Date();
        const startDate = new Date(Date.now() - 90*24*60*60*1000);
        historicals = await this.data.getHistorical(ticker, startDate, endDate);
      } catch (e) {
        console.warn(`Historical data fetch failed: ${e.message}`);
        historicals = [];
      }

      try {
        financials = await this.data.getFinancials(ticker);
      } catch (e) {
        console.warn(`Financials fetch failed: ${e.message}`);
        financials = {};
      }

      try {
        news = await this.data.getNews(ticker, 5);
      } catch (e) {
        console.warn(`News fetch failed: ${e.message}`);
        news = [];
      }

      const metrics = this.calculateMetrics(quote, historicals, financials);

      const prompt = `
【企業分析リクエスト】
銘柄: ${ticker}
現在値: $${quote.price}
変化率: ${metrics.change_pct}%
時価総額: ${financials.market_cap || 'N/A'}
PER: ${financials.pe_ratio || 'N/A'}
EPS成長率: ${financials.eps_growth || 'N/A'}%

過去90日トレンド: ${metrics.trend}
ボラティリティ: ${metrics.volatility}%
50日移動平均: ${metrics.ma50}
200日移動平均: ${metrics.ma200}

【最新ニュース】
${news.map((n, i) => `${i+1}. ${n.title} (${n.date})`).join('\n')}

上記データから投資判断を3点で述べよ。リスク要因も明記し、根拠を示せ。
`;

      return {
        ticker,
        quote,
        metrics,
        prompt,
        news,
        financials,
        dataProvider: this.data.active,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error('Stock analysis failed:', e.message);
      throw new Error(`Stock analysis failed: ${e.message}`);
    }
  }

  // ========== 新機能：テクニカル分析 ==========
  async analyzeTechnical(ticker) {
    try {
      const provider = this.data.providers['moomoo-extended'];
      if (!provider || !provider.getIndicators) {
        throw new Error('MooMoo Extended provider not available');
      }

      const indicators = await provider.getIndicators(ticker);
      
      return {
        ticker,
        timestamp: new Date().toISOString(),
        indicators,
        signals: this.generateTechnicalSignals(indicators)
      };
    } catch (e) {
      console.error('Technical analysis failed:', e.message);
      throw e;
    }
  }

  // ========== 新機能：イントラデイ分析 ==========
  async analyzeIntraday(ticker, interval = '15m') {
    try {
      const provider = this.data.providers['moomoo-extended'];
      if (!provider || !provider.getIntradayData) {
        throw new Error('MooMoo Extended provider not available');
      }

      const bars = await provider.getIntradayData(ticker, interval);
      const metrics = this.calculateIntradayMetrics(bars);

      return {
        ticker,
        interval,
        bars: bars.slice(-20), // 最新20本のみ
        metrics,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error('Intraday analysis failed:', e.message);
      throw e;
    }
  }

  // ========== 新機能：オプション分析 ==========
  async analyzeOptions(ticker, expirationDate = null) {
    try {
      const provider = this.data.providers['moomoo-extended'];
      if (!provider || !provider.getOptionChain) {
        throw new Error('MooMoo Extended provider not available');
      }

      const chain = await provider.getOptionChain(ticker, expirationDate);
      const analysis = this.analyzeOptionChain(chain);

      return {
        ticker,
        chain,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error('Option analysis failed:', e.message);
      throw e;
    }
  }

  // ========== 新機能：企業情報 ==========
  async getCompanyProfile(ticker) {
    try {
      const provider = this.data.providers['moomoo-extended'];
      if (!provider || !provider.getCompanyInfo) {
        throw new Error('MooMoo Extended provider not available');
      }

      const companyInfo = await provider.getCompanyInfo(ticker);
      const dividends = await provider.getDividends(ticker);
      const analystEst = await provider.getAnalystEstimates(ticker);

      return {
        ticker,
        company: companyInfo,
        dividends,
        analyst: analystEst,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error('Company profile failed:', e.message);
      throw e;
    }
  }

  // ========== 新機能：ポートフォリオ分析 ==========
  async analyzePortfolio(tickers) {
    try {
      const provider = this.data.providers['moomoo-extended'];
      if (!provider) {
        throw new Error('Provider not available');
      }

      const quotes = await provider.getMultipleQuotes(tickers);
      const correlations = await provider.getCorrelationMatrix(tickers.filter(t => 
        quotes.find(q => q.ticker === t && q.ok)
      ));
      const betas = await Promise.all(
        tickers.map(t => provider.getBetaValue(t))
      );

      return {
        portfolio: {
          tickers,
          quotes: quotes.filter(q => q.ok).map(q => q.data),
          correlationMatrix: correlations,
          betas
        },
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error('Portfolio analysis failed:', e.message);
      throw e;
    }
  }

  // ========== 新機能：セクター比較 ==========
  async compareSector(sector) {
    try {
      const provider = this.data.providers['moomoo-extended'];
      if (!provider || !provider.getSectorComparison) {
        throw new Error('MooMoo Extended provider not available');
      }

      const comparison = await provider.getSectorComparison(sector);

      return {
        sector,
        analysis: comparison,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error('Sector comparison failed:', e.message);
      throw e;
    }
  }

  // ========== ヘルパー関数 ==========
  calculateMetrics(quote, historicals, financials) {
    const prices = historicals.map(h => h.close || h.price || 0).filter(p => p > 0);
    
    if (prices.length === 0) {
      return {
        change_pct: 0,
        trend: 'UNKNOWN',
        volatility: 0,
        ma50: 0,
        ma200: 0
      };
    }

    const latest = prices[prices.length - 1];
    const prev = prices[0];
    const changePct = ((latest - prev) / prev * 100).toFixed(2);

    return {
      change_pct: changePct,
      trend: this.detectTrend(prices),
      volatility: this.calculateVolatility(prices).toFixed(2),
      ma50: this.calculateMA(prices, 50),
      ma200: this.calculateMA(prices, 200)
    };
  }

  detectTrend(prices) {
    if (prices.length < 20) return 'FLAT';
    const ma20 = this.calculateMA(prices, 20);
    const latest = prices[prices.length - 1];
    
    if (latest > ma20 * 1.02) return 'UPTREND';
    if (latest < ma20 * 0.98) return 'DOWNTREND';
    return 'FLAT';
  }

  calculateMA(prices, period) {
    const len = Math.min(period, prices.length);
    const slice = prices.slice(-len);
    const sum = slice.reduce((a, b) => a + b, 0);
    return (sum / slice.length).toFixed(2);
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sq, r) => sq + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100;
  }

  calculateIntradayMetrics(bars) {
    if (!bars || bars.length === 0) return {};
    
    const prices = bars.map(b => b.close);
    const high = Math.max(...bars.map(b => b.high));
    const low = Math.min(...bars.map(b => b.low));
    const volume = bars.reduce((sum, b) => sum + (b.volume || 0), 0);

    return {
      high,
      low,
      range: high - low,
      avgPrice: prices.reduce((a, b) => a + b) / prices.length,
      totalVolume: volume,
      currentPrice: prices[prices.length - 1]
    };
  }

  generateTechnicalSignals(indicators) {
    const signals = [];

    if (indicators.rsi < 30) signals.push('🟢 RSI < 30: 売られすぎ（買いシグナル）');
    if (indicators.rsi > 70) signals.push('🔴 RSI > 70: 買われすぎ（売りシグナル）');
    
    if (indicators.macd && indicators.macd.histogram > 0) {
      signals.push('🟢 MACD ポジティブ: 上昇トレンド');
    }
    if (indicators.macd && indicators.macd.histogram < 0) {
      signals.push('🔴 MACD ネガティブ: 下降トレンド');
    }

    return signals;
  }

  analyzeOptionChain(chain) {
    if (!chain.calls || !chain.puts) return {};

    const callVolume = chain.calls.reduce((sum, c) => sum + (c.volume || 0), 0);
    const putVolume = chain.puts.reduce((sum, p) => sum + (p.volume || 0), 0);
    const putCallRatio = putVolume / callVolume;

    return {
      callVolume,
      putVolume,
      putCallRatio: putCallRatio.toFixed(2),
      analysis: putCallRatio > 1.2 ? 'Bearish' : putCallRatio < 0.8 ? 'Bullish' : 'Neutral'
    };
  }
}

module.exports = AnalyticsEngineExtended;
