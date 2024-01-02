const express = require('express');
const path = require('path');
const router = express.Router();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');
const firebaseConfigInfo = require('../certificate/firebaseCertificate');

// Firebaseの設定
const firebaseApp = initializeApp(firebaseConfigInfo);
const firestore = getFirestore(firebaseApp);

router.get('/reservation', (req, res) => {
    console.log('GET /reservation');
    res.sendFile(path.join(__dirname, '..', 'public', 'reservation.html'));
});

router.post('/reservation', async (req, res) => {
    console.log('POST /reservation: ', req.body);
    try {
        const reservationData = req.body;
        const docRef = await addDoc(collection(firestore, 'reservations'), reservationData);
        console.log('Reservation saved: ', docRef.id);
        res.status(200).json({ message: 'Reservation saved successfully' });
    } catch (error) {
        console.error('Error saving reservation: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/reservation-get', async (req, res) => {
    console.log('GET /reservation-get: ', req.query);
    const date = req.query.date;

    try {
        const reservationCollection = collection(firestore, 'reservations');
        const q = query(reservationCollection, where('reservationDate', '==', date));
        const querySnapshot = await getDocs(q);

        console.log('Fetched reservations: ', querySnapshot.size);
        const reservationStatus = querySnapshot.docs.map((doc) => doc.data());
        res.json(reservationStatus);
    } catch (error) {
        console.error('Error fetching reservations: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/reservations', async (req, res) => {
    console.log('GET /reservations');
    try {
        const snapshot = await getDocs(collection(firestore, 'reservations'));
        console.log('Fetched all reservations: ', snapshot.size);
        const reservations = snapshot.docs.map(doc => doc.data());
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching all reservations: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/reservation-check', async (req, res) => {
    console.log('GET /reservation-check: ', req.query);
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
        console.log('Invalid request parameters');
        return res.status(400).json({ error: 'Invalid request parameters' });
    }

    try {
        const reservationCollection = collection(firestore, 'reservations');
        const q = query(reservationCollection, where('reservationDate', '==', date));
        const querySnapshot = await getDocs(q);

        let isAvailable = true;
        querySnapshot.forEach(doc => {
            const reservation = doc.data();
            const reservationStart = new Date(`${reservation.reservationDate} ${reservation.reservationStartTime}`);
            const reservationEnd = new Date(`${reservation.reservationDate} ${reservation.reservationEndTime}`);
            const newStart = new Date(`${date} ${startTime}`);
            const newEnd = new Date(`${date} ${endTime}`);

            console.log('Checking overlap for: ', { reservationStart, reservationEnd, newStart, newEnd });
            if (newStart < reservationEnd && newEnd > reservationStart) {
                console.log('Overlap detected');
                isAvailable = false;
            }
        });

        console.log('Reservation availability: ', isAvailable);
        res.json({ isAvailable });
    } catch (error) {
        console.error('Error in reservation check: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
