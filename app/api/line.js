const express = require('express');
const lineRouter = express.Router();

const lineHandlers = require('../services/lineService');

lineRouter.post('/', async (req, res) => {
    try {
        console.log('Webhook received:', JSON.stringify(req.body));
        const results = await Promise.all(req.body.events.map(lineHandlers.handleEvent));
        console.log('Results:', results);
        res.json(results);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = lineRouter;