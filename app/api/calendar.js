const path = require('path');
const express = require('express');
const calendarRouter = express.Router();

calendarRouter.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'calender.html'));
});

calendarRouter.get('/', async (req, res) => {
    try {
        const snapshot = await getDocs(collection(firestore, 'reservations'));
        const reservations = snapshot.docs.map(doc => doc.data());
        const calendar = generateCalendar(reservations);
        console.log(calendar)
        res.render(path.join(__dirname, '..', 'public', 'reservation.html'), { calendar });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function generateCalendar(reservations) {
    const calendar = [];
    reservations.forEach(reservation => {
        const date = new Date(reservation.date);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const formattedDate = `${year}-${month}-${day}`;
        if (!calendar.includes(formattedDate)) {
            calendar.push(formattedDate);
        }
    });
    return calendar;
}

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