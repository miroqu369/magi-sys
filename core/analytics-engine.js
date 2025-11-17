'use strict';

class AnalyticsEngine {
  constructor(dataManager) {
    this.data = dataManager;
  }

  async analyzeStock(ticker, opts = {}) {
    try {
      // 1. データ取得
      const quote = await this.data.getQuote(ticker);
      
      const endDate = new Date();
      const startDate = new Date(Date.now() - 90*24*60*60*1000);
      
      const historicals = await this.data.getHistorical(ticker, startDate, endDate);
      const financials = await this.data.getFinancials(ticker);
      const news = await this.data.getNews(ticker, 5);

      // 2. メトリクス計算
      const metrics = this.calculateMetrics(quote, historicals, financials);

      // 3. プロンプト組成
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
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      throw new Error(`Stock analysis failed: ${e.message}`);
    }
  }

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
}

module.exports = AnalyticsEngine;
