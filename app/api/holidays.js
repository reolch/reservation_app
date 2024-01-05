const express = require('express');
const holidaysRouter = express.Router();

const firebaseService = require('../services/firebaseService');

holidaysRouter.get('/', async (req, res) => {
    try {
        const holydays = await firebaseService.getDocumentsFromCollection('Holidays');
        console.log(holydays);
        res.json(holydays);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = holidaysRouter;