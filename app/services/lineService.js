const { Client } = require('@line/bot-sdk');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

const lineConfig = require('../certificate/lineCertificate');
const firebaseConfigInfo = require('../certificate/firebaseCertificate')

const client = new Client(lineConfig);

// Firebaseの設定
const firebaseApp = initializeApp(firebaseConfigInfo);
const firestore = getFirestore(firebaseApp);

const userStates = {};

/**
 * LINEのイベントを処理する関数。
 * 
 * @param {Object} event - LINEからのイベントオブジェクト。
 * @returns {Promise<string>} 処理結果のメッセージ。
 */
async function handleEvent(event) {
    try {
        if (!userStates[event.source.userId]) {
            userStates[event.source.userId] = { step: 0 };
        }

        const lastUserMessage = userStates[event.source.userId].lastUserMessage;
        const userMessage = event.message.text.toLowerCase();
        userStates[event.source.userId].lastUserMessage = userMessage;

        switch (userStates[event.source.userId].step) {
            case 0:
                await handleStep0(event, userMessage);
                break;

            case 1:
                await handleStep1(event, userMessage);
                break;

            case 2:
                await handleStep2(event, userMessage);
                break;

            case 3:
                await handleStep3(event, userMessage);
                break;

            default:
                break;
        }

        return 'Event handled successfully';
    } catch (error) {
        console.error('Error in handleEvent:', error);
        return 'Error in handleEvent';
    }
}

/**
 * ステップ0の処理を行う関数。
 * 
 * @param {Object} event - LINEからのイベントオブジェクト。
 * @param {string} userMessage - ユーザーからのメッセージ。
 * @returns {Promise<void>} なし。
 */
async function handleStep0(event, userMessage) {
    if (userMessage === '本日の空き情報') {
        const reservationStatus = await getTodayReservationStatusFromFirestore();
        let textMessage;
        if (reservationStatus.length > 0) {
            textMessage = await formatReservationStatus(reservationStatus);
        } else {
            textMessage = '本日の予約はありません。';
        }
        await client.replyMessage(event.replyToken, { type: 'text', text: textMessage });
    } else if (userMessage === '予約') {
        await client.replyMessage(event.replyToken, { type: 'text', text: '予約しますか？ [はい／いいえ]' });
        userStates[event.source.userId].step = 1;
    } else {
        await client.replyMessage(event.replyToken, { type: 'text', text: '予約がキャンセルされました。' });
        userStates[event.source.userId].step = 0;
    }
}

/**
 * ステップ1の処理を行う関数。
 * 
 * @param {Object} event - LINEからのイベントオブジェクト。
 * @param {string} userMessage - ユーザーからのメッセージ。
 * @returns {Promise<void>} なし。
 */
async function handleStep1(event, userMessage) {
    if (userMessage === 'はい') {
        await client.replyMessage(event.replyToken, { type: 'text', text: '予約したい日時を教えてください。例: 2023-12-31 14:00' });
        userStates[event.source.userId].step = 2;
    } else {
        await client.replyMessage(event.replyToken, { type: 'text', text: '予約がキャンセルされました。' });
        userStates[event.source.userId].step = 0;
    }
}

/**
 * ステップ2の処理を行う関数。
 * 
 * @param {Object} event - LINEからのイベントオブジェクト。
 * @param {string} userMessage - ユーザーからのメッセージ。
 * @returns {Promise<void>} なし。
 */
async function handleStep2(event, userMessage) {
    if (userMessage.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
        const confirmReservationMessage = {
            type: 'text',
            text: `以下の日時で予約を確定しますか？ [はい／いいえ]\n${userMessage}`,
        };
        userStates[event.source.userId].date = userMessage;
        await client.replyMessage(event.replyToken, confirmReservationMessage);
        userStates[event.source.userId].step = 3;
    } else {
        await client.replyMessage(event.replyToken, { type: 'text', text: '予約がキャンセルされました。' });
        userStates[event.source.userId].step = 0;
    }
}

/**
 * ステップ3の処理を行う関数。
 * 
 * @param {Object} event - LINEからのイベントオブジェクト。
 * @param {string} userMessage - ユーザーからのメッセージ。
 * @returns {Promise<void>} なし。
 */
async function handleStep3(event, userMessage) {
    if (userMessage === 'はい') {
        const successMessage = { type: 'text', text: 'ご予約ありがとうございます。' };
        try {
            const [date, time] = userStates[event.source.userId].date.split(' ');
            const reservationData = {
                customerName: userStates[event.source.userId].date,
                reservationDate: date,
                reservationStartTime: time,
                reservationEndTime: time,
            };
            const docRef = await addDoc(collection(firestore, 'reservations'), reservationData);
            console.log('Document written with ID: ', docRef.id);
        } catch (error) {
            console.error('Error saving reservation: ', error);
        }
        await client.replyMessage(event.replyToken, successMessage);
        userStates[event.source.userId].step = 0;
    } else {
        await client.replyMessage(event.replyToken, { type: 'text', text: '予約がキャンセルされました。' });
        userStates[event.source.userId].step = 0;
    }
}

/**
 * Firestoreから当日の予約状況を取得する関数。
 * 
 * @returns {Promise<Array<Object>>} 予約状況の配列。
 */
async function getTodayReservationStatusFromFirestore() {
    const japanStandardTime = new Date().toLocaleString({ timeZone: 'Asia/Tokyo' });
    const today = new Date(japanStandardTime);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const startOfDay = `${today.getFullYear()}-${month}-${day}`;
    console.log('startOfDay: ' + startOfDay);
    const reservationCollection = collection(firestore, 'reservations');
    const q = query(reservationCollection, where('reservationDate', '==', startOfDay));
    const querySnapshot = await getDocs(q);

    const reservationStatus = querySnapshot.docs.map((doc) => doc.data());
    return reservationStatus;
}

/**
 * 予約状況をフォーマットして文字列で返す関数。
 * 
 * @param {Array<Object>} reservationStatus - 予約状況の配列。
 * @returns {string} フォーマットされた予約状況の文字列。
 */
function formatReservationStatus(reservationStatus) {
    console.log('start formatReservationStatus');
    console.log('reservationStatus:', reservationStatus); // 予約ステータスのログ

    let statusText = '時間帯\t予約状況\n';

    for (let hour = 10; hour < 18; hour++) {
        for (let minutes = 0; minutes < 60; minutes += 30) {
            const time = `${hour}:${minutes === 0 ? '00' : minutes}`;
            console.log('Current Time Slot:', time); // 現在の時間枠のログ

            const currentTime = new Date();
            currentTime.setHours(hour);
            currentTime.setMinutes(minutes);
            currentTime.setSeconds(0);
            currentTime.setMilliseconds(0);

            console.log('currentTime:', currentTime); // currentTime のログ

            const hasReservation = reservationStatus.some((info) => {
                const [startHours, startMinutes] = info.reservationStartTime.split(':');
                const [endHours, endMinutes] = info.reservationEndTime.split(':');

                const startTime = new Date(currentTime);
                startTime.setHours(parseInt(startHours));
                startTime.setMinutes(parseInt(startMinutes));

                const endTime = new Date(currentTime);
                endTime.setHours(parseInt(endHours));
                endTime.setMinutes(parseInt(endMinutes));

                console.log(`Checking Slot: ${time}, Start Time: ${startTime}, End Time: ${endTime}`); // 各予約の時間範囲のログ

                return currentTime >= startTime && currentTime < endTime;
            });

            statusText += `${time}\t${hasReservation ? '×' : '〇'}\n`;
        }
    }

    console.log('Generated Status Text:', statusText); // 生成されたステータステキストのログ
    return statusText;
}

// 他の handleStep 関数...

module.exports = {
    handleEvent,
    handleStep0,
    handleStep1,
    handleStep2,
    handleStep3,
    getTodayReservationStatusFromFirestore,
    formatReservationStatus
};
