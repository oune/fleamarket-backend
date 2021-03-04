const functions = require("firebase-functions");
const admin = require("firebase-admin");
const check = require("../controllers/middle");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const db = admin.firestore();
const bookApp = express();

bookApp.use(cors({ origin: true }));

const moment = require('moment');
require('moment-timezone');

// 전체 목록 조회
bookApp.get("/", async (req, res) => {
  const snapshot = await db.collection("books").get();

  const books = [];
  snapshot.forEach((doc) => {
    const id = doc.id;
    const data = doc.data();

    books.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(books));
});

// 특정책 조회
bookApp.get("/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  const bookRef = db.collection("books").doc(bookId);
  const doc = await bookRef.get();
  const id = doc.id;

  res.status(200).send(JSON.stringify({ id, ...doc.data() }));
});

bookApp.post("/test", isValidTime(), async (req, res) => {

  res.status(200).send();
});

function isValidTime() {
  moment.tz.setDefault("Asia/Seoul");

  return (req, res, next) => {
      if (! moment(new Date()).isBetween(new Date('2021-03-04 09:59:59'),new Date('2021-03-12 18:00:00'))) {
        return res.status(421).send("예약할수 없는 시간입니다.");
      }
      next();
  };
}

// 예약 추가
bookApp.post(
  "/:bookId/reservations",
  check.requireField([
    "password",
    "name",
    "studentId",
    "time",
    "date",
    "title",
  ]),
  async (req, res) => {
    const bookRef = db.collection("books").doc(req.params.bookId);
    const reservationRef = db.collection("reservations").doc();
    const bcrypt = require("bcrypt");
    const saltRounds = 10;

    try {
      await db.runTransaction(async (t) => {
        const doc = await t.get(bookRef);
        const resCount = doc.data().stockCount > doc.data().reservationCount;

        if (resCount) {
          const reservation = req.body;

          reservation.bookId = req.params.bookId;
          reservation.isCancle = false;
          reservation.isSold = false;
          reservation.password = bcrypt.hashSync(
            reservation.password,
            saltRounds
          );

          await t.set(reservationRef, reservation);
          await t.update(bookRef, {
            reservationCount: admin.firestore.FieldValue.increment(1),
          });
        } else {
          throw new Error("no stock");
        }
      });
    } catch (e) {
      if (e.message === "no stock") {
        res.status(421).send("남은 재고 없음");
      } else if (
        e.message === "Cannot read property 'stockCount' of undefined"
      ) {
        res.status(421).send("문서가 존재 하지 않음");
      } else {
        console.log(e);
        res.status(421).send("알수없는 에러");
      }
    }
    res.status(201).send();
  }
);

//특정 책의 예약 조회
bookApp.get("/:bookId/reservations", async (req, res) => {
  const snapshot = await db
    .collection("reservations")
    .where("bookId", "==", req.params.bookId)
    .where("isCancle", "==", false)
    .get();

  let reservations = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    reservations.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(reservations));
});

// 예약 취소
bookApp.delete("/:bookId/reservations/:id", async (req, res) => {
  const reservationRef = db.collection("reservations").doc(req.params.id);
  const bookRef = db.collection("books").doc(req.params.bookId);
  const bcrypt = require("bcrypt");
  const query = req.query;

  if (Object.keys(query).length === 0) {
    res.status(400).send("password require");
    return;
  }

  try {
    await db.runTransaction(async (t) => {
      const doc = await t.get(reservationRef);
      const match = await bcrypt.compare(query.password, doc.data().password);
      const isCancle = doc.data().isCancle;
      const isSold = doc.data().isSold;

      if (isCancle) {
        throw new Error("이미 취소된 예약");
      }
      if (isSold) {
        throw new Error("이미 구매한 예약");
      }

      if (match) {
        await t.update(reservationRef, { isCancle: true });
        await t.update(bookRef, {
          reservationCount: admin.firestore.FieldValue.increment(-1),
        });
      } else {
        throw new Error("비밀번호가 다름");
      }
    });
  } catch (e) {
    if (e.message === "비밀번호가 다름") {
      res.status(421).send("비밀번호가 다름");
    } else if (e.message === "Cannot read property 'password' of undefined") {
      res.status(421).send("존재 하지 않는 문서 아이디");
    } else if (e.message === "이미 취소된 예약") {
      res.status(421).send("이미 취소된 예약");
    } else if (e.message === "이미 구매한 예약") {
      res.status(421).send("이미 구매한 예약");
    } else {
      console.log(e);
      res.status(421).send("알수없는 에러");
    }
  }

  res.status(200).send();
});

// 특정 책의 재고 조회
bookApp.get("/:bookId/stocks", async (req, res) => {
  const snapshot = await db
    .collection("stocks")
    .where("bookId", "==", req.params.bookId)
    .get();

  let stocks = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    stocks.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(stocks));
});

exports.books = functions.https.onRequest(bookApp);
