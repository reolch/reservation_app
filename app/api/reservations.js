const express = require('express');
const path = require('path');
const router = express.Router();

const reservationService = require('../services/reservationService');

router.get('/', (req, res) => {
    console.log('GET /');
    res.sendFile(path.join(__dirname, '..', 'public', 'reservation.html'));
});

router.post('/', async (req, res) => {
    console.log('POST /: ', req.body);
    await reservationService.createReservation(req, res);
});

router.delete('/:reservationId', async (req, res) => {
    console.log('DELETE /:reservationId: ', req.params.reservationId);
    await reservationService.deleteReservation(req.params.reservationId, res);
});

router.get('/all', async (req, res) => {
    console.log('GET /all: ', req.query);
    await reservationService.getAllReservations(req, res);
});

router.get('/thisMonth', async (req, res) => {
    console.log('GET /thisMonth: ', req.query);
    await reservationService.getAllReservationsForCurrentMonth(req, res);
});

router.get('/check', async (req, res) => {
    console.log('GET /check: ', req.query);
    await reservationService.checkReservation(req, res);
});

module.exports = router;
