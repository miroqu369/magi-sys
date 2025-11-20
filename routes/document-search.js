const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();

router.post('/api/documents/search-similar', async (req, res) => {
  const { query, top_k = 10, threshold = 0.5 } = req.body;

  if (!query) {
    res.status(400).json({ error: 'query required' });
    return;
  }

  try {
    const token = process.env.GCP_IDENTITY_TOKEN || '';
    const funcUrl = 'https://asia-northeast1-screen-share-459802.cloudfunctions.net/searchSimilar';

    const response = await fetch(funcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query, top_k, threshold })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
