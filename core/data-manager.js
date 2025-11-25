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

  // 複数プロバイダーから同時取得（Best-of 戦略）
  async getQuoteMulti(ticker, providerNames = null) {
    const targets = providerNames || Object.keys(this.providers);
    const promises = targets.map(name =>
      this.providers[name].getQuote(ticker)
        .then(data => ({ provider: name, ok: true, data }))
        .catch(err => ({ provider: name, ok: false, error: err.message }))
    );
    return Promise.all(promises);
  }

  // 単一プロバイダーから取得（アクティブプロバイダー使用）
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

  // プロバイダーのステータス確認
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

  // 複数ソースから最良値を取得（全プロバイダーから同時取得）
  async getQuoteBestOf(ticker) {
    const results = await this.getQuoteMulti(ticker);
    const valid = results.filter(r => r.ok);
    
    if (valid.length === 0) {
      throw new Error('No valid quotes found from any provider');
    }

    // 価格の平均と信頼度を返す
    const prices = valid.map(v => v.data.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      ticker,
      price: avg,
      providers: valid.map(v => ({ name: v.provider, price: v.data.price })),
      confidence: valid.length > 1 ? 'high' : 'medium'
    };
  }
}

module.exports = DataManager;
