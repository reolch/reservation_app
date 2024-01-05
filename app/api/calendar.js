const path = require('path');
const express = require('express');
const calendarRouter = express.Router();

const reservationHandlers = require('../services/reservationService');

calendarRouter.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'calender.html'));
});

calendarRouter.post('/calendar-webhook', handleCalendarWebhook);

function handleCalendarWebhook(req, res) {
    const event = req.body;
    const summary = event.summary;
    const startDateTime = new Date(event.start.dateTime);
    const endDateTime = new Date(event.end.dateTime);

    console.log('New event added:', { summary, startDateTime, endDateTime });

    res.status(200).send('OK');
}

module.exports = calendarRouter;