'use strict';
const express = require('express');

console.log('Starting MAGI System bootstrap...');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

app.get('/healthz', (req, res) => {
    console.log('Healthz check');
    res.status(200).send('ok');
});

app.get('/status', (req, res) => {
    console.log('Status check');
    res.json({
        service: 'magi-app',
        version: '1.0.0',
        time: new Date().toISOString(),
        secrets: {
            OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
            GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
            XAI_API_KEY: !!process.env.XAI_API_KEY,
            ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
        }
    });
});

app.get('/__routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            const methods = Object.keys(middleware.route.methods);
            methods.forEach(method => {
                routes.push({
                    method: method.toUpperCase(),
                    path: middleware.route.path
                });
            });
        }
    });
    res.json({ routes });
});

global.app = app;

try {
    console.log('Loading server.js...');
    require('./server.js');
    console.log('server.js loaded successfully');
} catch (error) {
    console.error('Failed to load server.js:', error.message);
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`MAGI System running on port ${PORT}`);
});
