const { initializeApp } = require('firebase/app');
const { doc, getFirestore, collection, addDoc, deleteDoc, getDocs, query, where, orderBy } = require('firebase/firestore');
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
        const docRef = await addDoc(collection(firestore, 'Appointments'), reservationData);
        console.log('Reservation saved: ', docRef.id);
        res.status(200).json({ message: 'Reservation saved successfully' });
    } catch (error) {
        console.error('Error saving reservation: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 指定されたドキュメントIDを持つ予約情報を削除する。
 * 
 * @param {string} reservationId - 予約情報のドキュメントID。
 * @param {Object} res - HTTPレスポンスオブジェクト。
 * @returns {Promise<void>} なし。
 */
exports.deleteReservation = async (reservationId, res) => {
    console.log('deleteReservation: ', reservationId);
    try {
        await deleteDoc(doc(firestore, 'Appointments', reservationId));
        console.log('Reservation deleted: ', reservationId);
        res.status(200).json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        console.error('Error deleting reservation: ', error);
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
        const reservationCollection = collection(firestore, 'Appointments');
        const q = query(reservationCollection, where('StartDate', '==', date));
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
        const snapshot = await getDocs(collection(firestore, 'Appointments'));
        console.log('Fetched all reservations: ', snapshot.size);
        const reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching all reservations: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * 今月のすべての予約情報を取得する。
 * 
 * @param {Object} req - HTTPリクエストオブジェクト。
 * @param {Object} res - HTTPレスポンスオブジェクト。
 * @returns {Promise<void>} なし。
 */
exports.getAllReservationsForCurrentMonth = async (req, res) => {
    try {
        // 現在の月の最初の日と最後の日を計算
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        console.log('firstDayOfMonth: ', new Date(now.getFullYear(), now.getMonth(), 1));
        console.log('lastDayOfMonth: ', new Date(now.getFullYear(), now.getMonth() + 1, 0));

        // Firestoreで今月の予約をクエリ
        const reservationsQuery = query(
            collection(firestore, 'Appointments'),
            where('date', '>=', firstDayOfMonth),
            where('date', '<=', lastDayOfMonth),
            orderBy('date')
        );

        const snapshot = await getDocs(reservationsQuery);
        console.log('Fetched this month\'s reservations: ', snapshot.size);
        const reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching this month\'s reservations: ', error);
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
        const reservationCollection = collection(firestore, 'Appointments');
        const q = query(reservationCollection, where('StartDate', '==', date));
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