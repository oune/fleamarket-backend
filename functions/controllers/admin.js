const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();

const adminApp = express();

adminApp.use(cors({ origin: true }));

adminApp.post("/books", async (req, res) => {
  const user = req.body;
  user.stockCount = 0;
  user.reservationCount = 0;

  await db.collection("books").doc(user["title"]).set(user);

  res.status(201).send();
});

adminApp.put("/books/:title", async (req, res) => {
  const body = req.body;

  await db.collection("books").doc(req.params.title).update(body);

  res.status(200).send();
});

adminApp.delete("/books/:title", async (req, res) => {
  await db.collection("books").doc(req.params.title).delete();

  res.status(200).send();
});

adminApp.post("/books/:title/stocks", async (req, res) => {
  const stock = req.body;
  stock.title = req.params.title;

  await db.collection("stocks").add(stock);
  await db.collection("books").doc(req.params.title).update({
    stockCount: admin.firestore.FieldValue.increment(1)
  });

  res.status(201).send();
});

adminApp.put("/stocks/:id", async (req, res) => {
  const body = req.body;

  await db.collection("stocks").doc(req.params.id).update(body);

  res.status(200).send();
});

adminApp.delete("/:title/stocks/:id", async (req, res) => {
  await db.collection("stocks").doc(req.params.id).delete();
  await db.collection("books").doc(req.params.title).update({
    stockCount: admin.firestore.FieldValue.increment(-1)
  });

  res.status(200).send();
});

exports.admin = functions.https.onRequest(adminApp);