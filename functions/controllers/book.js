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

bookApp.post("/:title/reservations", async (req, res) => { //TODO 판매중인 개수와 비교해서 예약할수 있는지 확인이 필요
  const reservation = req.body;
  reservation.title = req.params.title;
  reservation.isCancle = false;

  await db.collection("reservations").add(reservation);
  await db.collection("books").doc(req.params.title).update({
    reservationCount: admin.firestore.FieldValue.increment(1)
  });

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

bookApp.put("/reservations/:id", async (req, res) => {
  const body = req.body;

  await db.collection("reservations").doc(req.params.id).update(body);

  res.status(200).send();
});

bookApp.delete("/:title/reservations/:id", async (req, res) => {
  const data = {
    "isCancle":true
  }

  await db.collection("reservations").doc(req.params.id).update(data);
  await db.collection("books").doc(req.params.title).update({
    reservationCount: admin.firestore.FieldValue.increment(-1)
  });

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