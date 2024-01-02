const express = require('express');
const path = require('path');
const router = express.Router();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');
const firebaseConfigInfo = require('../certificate/firebaseCertificate')
// Firebaseの設定
const firebaseApp = initializeApp(firebaseConfigInfo);
const firestore = getFirestore(firebaseApp);

router.get('/reservation', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'reservation.html'));
});

router.post('/reservation', handleReservation);

// POSTリクエストを処理してデータベースに保存
router.post('/reservation', async (req, res) => {
    await handleReservation();
});

router.get('/reservation-get', async (req, res) => {
    const date = req.query.date;
    const type = req.query.type;

    const reservationCollection = collection(firestore, 'reservations');
    const q = query(reservationCollection, where('reservationDate', '==', date));
    const querySnapshot = await getDocs(q);

    const reservationStatus = querySnapshot.docs.map((doc) => doc.data());

    res.json(reservationStatus);
});

router.get('/reservations', async (req, res) => {
    const snapshot = await getDocs(collection(firestore, 'reservations'));
    const reservations = snapshot.docs.map(doc => doc.data());
    res.json(reservations);
});

router.get('/reservation-check', async (req, res) => {
    const { date, startTime, endTime, type } = req.query;

    // リクエストパラメータのログ出力
    console.log('Query Parameters:', req.query);

    // パラメータの存在を確認
    if (!date || !startTime || !endTime || !type) {
        console.log('Invalid request parameters');
        return res.status(400).json({ error: 'Invalid request parameters' });
    }

    try {
        const reservationCollection = collection(firestore, 'reservations');
        const q = query(reservationCollection, where('reservationDate', '==', date));
        const querySnapshot = await getDocs(q);

        let isAvailable = true;

        const reservationStatus = querySnapshot.docs.map((doc) => doc.data());

        console.log(reservationStatus);

        querySnapshot.forEach(doc => {
            const reservation = doc.data();
            const reservationStart = new Date(`${reservation.reservationDate} ${reservation.reservationStartTime}`);
            const reservationEnd = new Date(`${reservation.reservationDate} ${reservation.reservationEndTime}`);
            const newStart = new Date(`${date} ${startTime}`);
            const newEnd = new Date(`${date} ${endTime}`);

            console.log(`Checking overlap: Reservation [${reservationStart} to ${reservationEnd}], Requested [${newStart} to ${newEnd}]`);

            console.log('newStart: ' + newStart);
            console.log('reservationEnd: ' + reservationEnd);
            console.log('newStart < reservationEnd: ' + newStart < reservationEnd);
            console.log('newEnd > reservationStart: ' + newEnd > reservationStart);
            // 予約の時間帯が重複しているかチェック
            if (newStart < reservationEnd && newEnd > reservationStart) {
                console.log('Overlap detected');
                isAvailable = false;
            } else {
                console.log('No overlap');
            }
        });

        console.log('Is available:', isAvailable);
        res.json({ isAvailable });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function handleReservation(req, res) {
    try {
        const reservationData = req.body;
        console.log(reservationData);
        const docRef = await addDoc(collection(firestore, 'reservations'), reservationData);
        console.log('Document written with ID: ', docRef.id);
        res.status(200).json({ message: 'Reservation saved successfully' });
    } catch (error) {
        console.error('Error saving reservation: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = router;