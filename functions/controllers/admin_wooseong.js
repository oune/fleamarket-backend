const functions = require("firebase-functions");
const admin = require('firebase-admin');
const check = require('./middle');
const keyName = require('../controllers/getType');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const adminApp = express();

adminApp.use(cors({ origin: true }));

/***
made by WooSeong
현재 날짜 문자열로 받아오는 함수
***/
const getStringDate = () => {
  const today = new Date();

  const year = today.getFullYear(); // 년도
  let month = today.getMonth() + 1;  // 월
  let date = today.getDate();  // 날짜

  if (+month < 10)
    month = '0' + month
  if (+date < 10)
    date = '0' + date

  return year + '-' + month + '-' + date
}

/***
made by WooSeong
유효하지 않은 예약 제거
***/
adminApp.get("/reservations/schedular", async (req, res) => {
  const nowDate = getStringDate();
  const rsvSnaps = await db.collection("reservations").get();

  try {
    rsvSnaps.forEach(async (rsvSnap) => {
      //트랜잭션 실행
      await db.runTransaction(async t => {
        const rsvData = rsvSnap.data()
        const rsvRef = rsvSnap._ref
        const { isCancel, state, date } = rsvData;

        const bookRef = await db.collection("books").doc(rsvData.bookId)

        if (date <= nowDate && !isCancel) {
          await t.update(rsvRef, { "isCancel": true });

          const json = {}
          json[keyName.getReservationCountName(state)] = admin.firestore.FieldValue.increment(-1);
          console.log(json)
          await t.update(bookRef, json);
        }
      });
    })
    res.status(200).send();
  }
  catch (e) {
    console.log(e)
    res.status(421).send("취소 실패 : 알수없는 에러");
  }
});

exports.admin_wooseong = functions.https.onRequest(adminApp);