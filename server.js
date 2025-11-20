'use strict';
const app = global.app;

app.post('/api/consensus', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    res.json({ final: `Analysis for: ${prompt.substring(0, 50)}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/stock/search', async (req, res) => {
  try {
    const { ticker } = req.body;
    if (!ticker) return res.status(400).json({ error: 'ticker required' });

    const fetch = (await import('node-fetch')).default;
    const audience = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net/fetchStockData';
    
    const tokenResp = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=' + encodeURIComponent(audience), {
      headers: { 'Metadata-Flavor': 'Google' }
    });
    
    const token = (await tokenResp.text()).trim();
    
    const response = await fetch(audience, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ticker })
    });

    if (!response.ok) return res.status(response.status).json({ error: await response.text() });
    res.json(await response.json());
  } catch (e) {
    console.error('error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
