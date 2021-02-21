const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();
const bookApp = express();

bookApp.use(cors({ origin: true }));

bookApp.get("/", async (req, res) => {
  const snapshot = await db.collection("books").get();

  let books = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    books.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(books));
});

bookApp.post("/:title/reservations", async (req, res) => {
  const bookRef = db.collection("books").doc(req.params.title);
  const reservationRef = db.collection("reservations").doc();

  try {
    await db.runTransaction(async t => {
      const doc = await t.get(bookRef);
      const resCount = doc.data().stockCount - doc.data().reservationCount;

      if (resCount > 0) {
        const reservation = req.body;
        reservation.title = req.params.title;
        reservation.isCancle = false;

        await t.set(reservationRef, reservation);
        await t.update(bookRef, {reservationCount: admin.firestore.FieldValue.increment(1)});

      } else {
        throw new Error("no stock");
      }

    });
  } catch (e) {
    res.status(421).send("트랜잭션 실패");
  }
  res.status(201).send();
});

bookApp.get("/:title/reservations", async (req, res) => {
  const snapshot = await db.collection("reservations").where("title", "==", req.params.title).where("isCancle", "==", false).get();

  let reservations = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    reservations.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(reservations));
});

bookApp.get("/:studentId/:name/reservations", async (req, res) => {
  const snapshot = await db.collection("reservations").where("studentId", "==", req.params.studentId).where("name", "==", req.params.name).where("isCancle", "==", false).get();

  let reservations = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    reservations.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(reservations));
});

bookApp.put("/reservations/:id", async (req, res) => {
  const body = req.body;

  await db.collection("reservations").doc(req.params.id).update(body);

  res.status(200).send();
});

bookApp.delete("/:title/reservations/:id/:password", async (req, res) => {
  const reservationRef = db.collection("reservations").doc(req.params.id);
  const bookRef = db.collection("books").doc(req.params.title);

  try {
    await db.runTransaction(async t => {
      const doc = await t.get(reservationRef);

      if (doc.data().password === req.params.password) {
        await t.update(reservationRef, { "isCancle": true });
        await t.update(bookRef, { reservationCount: admin.firestore.FieldValue.increment(-1) });
      } else {
        throw new Error("비밀번호가 다름");
      }
    });
  } catch (e) {
    console.log('Transaction failure:', e);
    res.status(421).send("트랜잭션 실패");
  }

  res.status(200).send();
});

bookApp.get("/:title/stocks", async (req, res) => {
  const snapshot = await db.collection("stocks").where("title", "==", req.params.title).get();

  let stocks = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    stocks.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(stocks));
});

exports.books = functions.https.onRequest(bookApp);