const functions = require("firebase-functions");
const admin = require('firebase-admin');
const check = require('../controllers/middle');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const reservationApp = express();

reservationApp.use(cors({ origin: true }));

// 특정 책의 예약 내용 수정
reservationApp.put("/:id", checkRequireField(), check.impossibleField(["bookId", "isCancle", "title", "isSold"]), async (req, res) => {
  const reservationRef = db.collection("reservations").doc(req.params.id);
  const bcrypt = require('bcrypt');
  const body = req.body;

  try {
    await db.runTransaction(async t => {
      const passwordRef = await t.get(reservationRef);
      const password = await passwordRef.data().password;
      const match = await bcrypt.compare(req.query.password, password);

      const saltRounds = 10;

      if (match) {
        if (Object.prototype.hasOwnProperty.call(body, "password")) {
          body.password = bcrypt.hashSync(body.password, saltRounds);
        }
        await t.update(reservationRef, body);
      } else {
        throw new Error("wrong password");
      }
    });
  } catch (e) {
    if (e.message === "wrong password") {
      return res.status(421).send("wrong password");
    } else {
      console.log(e);
      return res.status(421).send("알수없는 에러");
    }
  }
  return res.status(200).send();
});

// 특정 예약의 비밀번호 조회
reservationApp.get("/:id/password", checkRequireField() ,async (req, res) => {
  const bcrypt = require('bcrypt');
  const passwordRef = await db.collection("reservations").doc(req.params.id).get();
  const password = await passwordRef.data().password;
  const match = await bcrypt.compare(req.query.password, password);
  const message = {};

  message.success = match;

  return res.status(200).send(JSON.stringify(message));
});

function checkRequireField() {
  return (req, res, next) => {
    if (!Object.prototype.hasOwnProperty.call(req.query, "password")) {
        return res.status(400).send(`password is required`);
    }
    return next();
};
}

exports.reservations = functions.https.onRequest(reservationApp);