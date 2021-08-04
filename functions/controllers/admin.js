const functions = require("firebase-functions");
const admin = require('firebase-admin');
const check = require('../controllers/middle');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const adminApp = express();

adminApp.use(cors({ origin: true }));

// 도서 추가
adminApp.post("/books", check.requireField(["title", "publisher", "author"]), async (req, res) => {
  const user = req.body;

  await db.collection("books").add(user);

  res.status(201).send();
});

// 도서 내용 수정
adminApp.put("/books/:id", check.impossibleField(["reservationCount", "stockCount"]), async (req, res) => {
  const body = req.body;

  await db.collection("books").doc(req.params.id).update(body);

  res.status(200).send();
});

// 도서 삭제
adminApp.delete("/books/:id", async (req, res) => {
  const batch = db.batch();

  const bookRef = await db.collection("books").doc(req.params.id);
  batch.delete(bookRef);

  const stockSnapshot = await db.collection("stocks").where("bookId", "==", req.params.id).get();
  stockSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  const reservationSnapshot = await db.collection("reservations").where("bookId", "==", req.params.id).get();
  reservationSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  res.status(200).send();
});

// 도서 재고 추가
adminApp.post("/books/:id/stocks", check.requireField(["name", "studentId", "price", "state"]), async (req, res) => {
  try {
    const stock = req.body;
    stock.conditionId = req.params.id;
    stock.isSold = false;

    const batch = db.batch();

    const stockRef = db.collection("stocks").doc();
    batch.set(stockRef, stock);

    const bookRef = db.collection("books").doc(req.params.id);
    batch.update(bookRef, { stockCount: admin.firestore.FieldValue.increment(1) });

    await batch.commit();
  } catch (e) {
    console.log(e);
    res.status(400).send("오류 발생");
  }

  res.status(201).send();
});

// 재고 내용 수정
adminApp.put("/stocks/:id", check.impossibleField(["conditionId"]), async (req, res) => {
  const body = req.body;

  await db.collection("stocks").doc(req.params.id).update(body);

  res.status(200).send();
});

// 재고 삭제
adminApp.delete("/books/:conditionId/stocks/:id", async (req, res) => {
  const batch = db.batch();

  const stockRef = db.collection("stocks").doc(req.params.id);
  batch.delete(stockRef);

  const bookRef = db.collection("books").doc(req.params.conditionId);
  batch.update(bookRef, { stockCount: admin.firestore.FieldValue.increment(-1) });

  await batch.commit();

  res.status(200).send();
});

// 예약 수정
adminApp.put("/reservations/:id", check.impossibleField(["conditionId", "isCancel", "title"]), async (req, res) => {
  const reservationRef = db.collection("reservations").doc(req.params.id);
  const bcrypt = require('bcrypt');
  const body = req.body;
  const saltRounds = 10;

  if (Object.prototype.hasOwnProperty.call(body, "password")) {
    body.password = bcrypt.hashSync(body.password, saltRounds);
  }

  reservationRef.update(body);

  return res.status(200).send();
});

// 예약 취소
adminApp.delete("/books/:conditionId/reservations/:id", async (req, res) => {
  const reservationRef = db.collection("reservations").doc(req.params.id);
  const conditionRef = db.collection("books").doc(req.params.conditionId);

  try {
    await db.runTransaction(async t => {
      const available = await !(await t.get(reservationRef)).data().isCancel;

      if (available) {
        await t.update(reservationRef, { "isCancel": true });
        await t.update(conditionRef, { reservationCount: admin.firestore.FieldValue.increment(-1) });
      } else {
        throw new Error("이미 취소된 예약");
      }
    });
  } catch (e) {
    if (e.message === "Cannot read property 'password' of undefined") {
      res.status(421).send("존재 하지 않는 문서 아이디");
    } else if (e.message === "이미 취소된 예약") {
      res.status(421).send("이미 취소된 예약");
    }
    else {
      console.log(e)
      res.status(421).send("알수없는 에러");
    }
  }
  res.status(200).send();
});

// 책상태 추가
adminApp.put("/books/:bookId/:condition", check.requireField(["condition"]), async(req, res) => {
    const condition = req.body;
    condition.bookId = req.params.bookId;
    condition.condition = req.params.condition;
    condition.stockCount = 0;
    condition.reservationCount = 0;

    await db.collection("conditions").add(condision);

    res.status(201).send();
});

// 책상태 수정
// 책상태 책아이디로 조회
// 책상태 

exports.admin = functions.https.onRequest(adminApp);