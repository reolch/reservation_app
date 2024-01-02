const express = require('express');
const path = require('path');
const router = express.Router();

const reservationHandlers = require('../services/reservationHandlers');

router.get('/', (req, res) => {
    console.log('GET /');
    res.sendFile(path.join(__dirname, '..', 'public', 'reservation.html'));
});

router.post('/', async (req, res) => {
    console.log('POST /: ', req.body);
    await reservationHandlers.createReservation(req, res);
});

router.get('/all', async (req, res) => {
    console.log('GET /all: ', req.query);
    await reservationHandlers.getReservation(req, res);
});

router.get('/calendar', async (req, res) => {
    console.log('GET /reservations: ', req.query);
    await reservationHandlers.getCalendar(req, res);
});

router.get('/check', async (req, res) => {
    console.log('GET /check: ', req.query);
    await reservationHandlers.checkReservation(req, res);
});

module.exports = router;
