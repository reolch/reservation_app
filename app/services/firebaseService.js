const { initializeApp } = require('firebase/app');
const { doc, getFirestore, collection, addDoc, getDoc, getDocs, query, where } = require('firebase/firestore');
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
exports.regist = async (req, res) => {
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
 * 新しい顧客を登録する。
 * 
 * @param {Object} req - HTTPリクエストオブジェクト。
 * @param {Object} res - HTTPレスポンスオブジェクト。
 * @returns {Promise<void>} なし。
 */
exports.registerCustomer = async (req, res) => {
    try {
        const customerData = req.body; // 顧客データをリクエストボディから取得
        const docRef = await addDoc(collection(firestore, 'Customers'), customerData); // Firestoreの'Customers'コレクションにデータを追加
        console.log('Customer registered: ', docRef.id); // 登録成功のログ
        res.status(200).json({ message: 'Customer registered successfully' }); // 成功レスポンス
    } catch (error) {
        console.error('Error registering customer: ', error); // エラーログ
        res.status(500).json({ error: 'Internal Server Error' }); // エラーレスポンス
    }
};



/**
 * 指定されたコレクションからドキュメントを取得する汎用関数
 * @param {string} collectionName - 取得するコレクションの名前
 * @returns {Promise<object[]>} - 取得したドキュメントのデータの配列
 */
exports.getDocumentsFromCollection = async (collectionName) => {
    try {
        const targetCollection = collection(firestore, collectionName);
        const q = query(targetCollection);
        const querySnapshot = await getDocs(q);

        console.log(`Fetched documents from ${collectionName}: `, querySnapshot.size);
        return querySnapshot.docs.map((doc) => ({
            docId: doc.id,
            docData: doc.data(),
        }));
    } catch (error) {
        console.error(`Error fetching documents from ${collectionName}: `, error);
        throw new Error('Internal Server Error');
    }
};

/**
 * 指定されたIDに一致する顧客を検索する関数
 * @param {string} customerId - 検索する顧客のID
 * @returns {Promise<object>} - 一致する顧客のドキュメントデータ
 */
exports.getCustomerById = async (customerId) => {
    console.log('customerId: ' + customerId);
    try {
        const customerRef = doc(firestore, "Customers", customerId);
        console.log(`Document Reference: ${customerRef}`);
        const docSnapshot = await getDoc(customerRef);

        if (docSnapshot.exists()) {
            console.log(`Found customer with ID ${customerId}`);
            return { docId: docSnapshot.id, docData: docSnapshot.data() };
        } else {
            console.log(`No customer found with ID ${customerId}`);
            return null; // またはエラーを投げる
        }
    } catch (error) {
        console.error(`Error finding customer with ID ${customerId}: `, error);
        throw new Error('Internal Server Error');
    }
};

/**
 * 指定された名前に一致する顧客を検索する関数
 * @param {string} name - 検索する顧客の名前
 * @returns {Promise<object[]>} - 一致する顧客のドキュメントのデータの配列
 */
exports.getCustomerByName = async (name) => {
    try {
        const targetCollection = collection(firestore, "Customers"); // 顧客情報が格納されているコレクション名を指定
        const q = query(targetCollection, where("Name", "==", name)); // 名前でフィルタリング
        const querySnapshot = await getDocs(q);

        console.log(`Found customer with name ${name}: `, querySnapshot.size);
        return querySnapshot.docs.map((doc) => ({
            docId: doc.id,
            docData: doc.data(),
        }));
    } catch (error) {
        console.error(`Error finding customer with name ${name}: `, error);
        throw new Error('Internal Server Error');
    }
};

/**
 * 指定された電話番号に一致する顧客を検索する関数
 * @param {string} phoneNumber - 検索する顧客の電話番号
 * @returns {Promise<object[]>} - 一致する顧客のドキュメントのデータの配列
 */
exports.getCustomerByPhoneNumber = async (phoneNumber) => {
    try {
        const targetCollection = collection(firestore, "Customers"); // 顧客情報が格納されているコレクション名を指定
        const q = query(targetCollection, where("ContactInfo.Phone", "==", phoneNumber)); // 電話番号でフィルタリング
        const querySnapshot = await getDocs(q);

        console.log(`Found customer with phone number ${phoneNumber}: `, querySnapshot.size);
        return querySnapshot.docs.map((doc) => ({
            docId: doc.id,
            docData: doc.data(),
        }));
    } catch (error) {
        console.error(`Error finding customer with phone number ${phoneNumber}: `, error);
        throw new Error('Internal Server Error');
    }
};

exports.getCustomers = async (req, res) => {
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