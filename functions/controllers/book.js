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

bookApp.post("/", async (req, res) => {
  const user = req.body;
  user.stockCount = 0;
  user.reservationCount = 0;

  await db.collection("books").doc(user["title"]).set(user);

  res.status(201).send();
});

bookApp.put("/:title", async (req, res) => {
  const body = req.body;

  await db.collection("books").doc(req.params.title).update(body);

  res.status(200).send();
});

bookApp.delete("/:title", async (req, res) => {
  await db.collection("books").doc(req.params.title).delete();

  res.status(200).send();
});

bookApp.post("/:title/reservations", async (req, res) => { //TODO 판매중인 개수와 비교해서 예약할수 있는지 확인이 필요
  const reservation = req.body;
  reservation.title = req.params.title;
  reservation.time = admin.firestore.Timestamp.now();

  await db.collection("reservations").add(reservation);
  await db.collection("books").doc(req.params.title).update({
    reservationCount: admin.firestore.FieldValue.increment(1)
  });

  res.status(201).send();
});

bookApp.get("/:title/reservations", async (req, res) => {
  const snapshot = await db.collection("reservations").where("title", "==", req.params.title).get();

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

bookApp.delete("/reservations/:id", async (req, res) => {
  await db.collection("reservations").doc(req.params.id).delete();

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

bookApp.post("/:title/stocks", async (req, res) => {
  const stock = req.body;
  stock.title = req.params.title;

  await db.collection("stocks").add(stock);
  await db.collection("books").doc(req.params.title).update({
    stockCount: admin.firestore.FieldValue.increment(1)
  });

  res.status(201).send();
});

bookApp.put("/stocks/:id", async (req, res) => {
  const body = req.body;

  await db.collection("stocks").doc(req.params.id).update(body);

  res.status(200).send();
});

bookApp.delete("/:title/stocks/:id", async (req, res) => {
  await db.collection("stocks").doc(req.params.id).delete();
  await db.collection("books").doc(req.params.title).update({
    stockCount: admin.firestore.FieldValue.increment(-1)
  });

  res.status(200).send();
});

exports.books = functions.https.onRequest(bookApp);