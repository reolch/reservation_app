const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');
const firebaseConfigInfo = require('../certificate/firebaseCertificate');

// Firebaseの設定
const firebaseApp = initializeApp(firebaseConfigInfo);
const firestore = getFirestore(firebaseApp);

/**
 * 新しい予約を作成する。
 * 
 * @param {Object} req - HTTPリクエストオブジェクト。
 * @param {Object} res - HTTPレスポンスオブジェクト。
 * @returns {Promise<void>} なし。
 */
exports.createReservation = async (req, res) => {
    try {
        const reservationData = req.body;
        const docRef = await addDoc(collection(firestore, 'reservations'), reservationData);
        console.log('Reservation saved: ', docRef.id);
        res.status(200).json({ message: 'Reservation saved successfully' });
    } catch (error) {
        console.error('Error saving reservation: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 指定された日付の予約情報を取得する。
 * 
 * @param {Object} req - HTTPリクエストオブジェクト。日付はクエリパラメータとして提供される。
 * @param {Object} res - HTTPレスポンスオブジェクト。
 * @returns {Promise<void>} なし。
 */
exports.getReservation = async (req, res) => {
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
};

/**
 * すべての予約情報を取得する。
 * 
 * @param {Object} req - HTTPリクエストオブジェクト。
 * @param {Object} res - HTTPレスポンスオブジェクト。
 * @returns {Promise<void>} なし。
 */
exports.getAllReservations = async (req, res) => {
    try {
        const snapshot = await getDocs(collection(firestore, 'reservations'));
        console.log('Fetched all reservations: ', snapshot.size);
        const reservations = snapshot.docs.map(doc => doc.data());
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching all reservations: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 指定された日時に予約が可能かどうかを確認する。
 * 
 * @param {Object} req - HTTPリクエストオブジェクト。日時はクエリパラメータとして提供される。
 * @param {Object} res - HTTPレスポンスオブジェクト。
 * @returns {Promise<void>} なし。
 */
exports.checkReservation = async (req, res) => {
    console.log('GET /check: ', req.query);
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
}

exports.updateReservation = async (req, res) => {
    // 予約更新のロジック
};

exports.deleteReservation = async (req, res) => {
    // 予約削除のロジック
};