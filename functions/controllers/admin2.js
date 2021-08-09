const functions = require("firebase-functions");
const admin = require('firebase-admin');
const check = require('../controllers/middle');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const adminApp = express();

adminApp.use(cors({ origin: true }));

// 유효하지 않은 예약 제거
adminApp.delete("/reservations/schedular", async (req, res) => {
  const reservations = await db.collection("reservations").get();
  const batch = db.batch();

  const rsvIds = []

  reservations.forEach((doc) => { rsvIds.push(doc.id) });

  const today = new Date();

  const year = today.getFullYear(); // 년도
  const month = today.getMonth() + 1;  // 월
  const date = today.getDate();  // 날짜

  const nowDate = year + '-0' + month + '-0' + date

  try {
    for (id of rsvIds) {
      const rsvRef = await db.collection("reservations").doc(id);
      const rsvData = await (await rsvRef.get()).data();

      if (rsvData.date <= nowDate && !rsvData.isCancel) {
        batch.update(rsvRef, {
          bookId: rsvData.bookId,
          date: rsvData.date,
          isCancel: true,
        });
      }
    }

  } catch (e) {
    console.log(e)
    res.status(421).send("알수없는 에러");
  }
  await batch.commit();

  res.status(200).send();

});

exports.admin2 = functions.https.onRequest(adminApp);