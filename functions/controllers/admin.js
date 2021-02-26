const functions = require("firebase-functions");
const admin = require('firebase-admin');
const check = require('../controllers/middle');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const adminApp = express();

adminApp.use(cors({ origin: true }));

adminApp.post("/books", check.requireField(["title", "publisher", "auther"]), async (req, res) => {
  const user = req.body;
  user.stockCount = 0;
  user.reservationCount = 0;

  await db.collection("books").add(user);

  res.status(201).send();
});

adminApp.put("/books/:id", check.impossibleField(["reservationCount", "stockCount"]), async (req, res) => {
  const body = req.body;

  await db.collection("books").doc(req.params.id).update(body);

  res.status(200).send();
});

adminApp.delete("/books/:id", async (req, res) => {
  await db.collection("books").doc(req.params.id).delete();

  res.status(200).send();
});

adminApp.delete("/new/books/:id", async (req, res) => {
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

adminApp.post("/books/:id/stocks", check.requireField(["name", "studentId", "price", "state"]), async (req, res) => {
  const stock = req.body;
  stock.bookId = req.params.id;
  stock.isSold = false;

  const batch = db.batch();

  const stockRef = db.collection("stocks").doc();
  batch.set(stockRef, stock);

  const bookRef = db.collection("books").doc(req.params.id);
  batch.update(bookRef, { stockCount: admin.firestore.FieldValue.increment(1) });

  await batch.commit();

  res.status(201).send();
});

adminApp.put("/stocks/:id", check.impossibleField(["bookId"]), async (req, res) => {
  const body = req.body;

  await db.collection("stocks").doc(req.params.id).update(body);

  res.status(200).send();
});

adminApp.delete("/books/:bookId/stocks/:id", async (req, res) => {
  const batch = db.batch();

  const stockRef = db.collection("stocks").doc(req.params.id);
  batch.delete(stockRef);

  const bookRef = db.collection("books").doc(req.params.bookId);
  batch.update(bookRef, { stockCount: admin.firestore.FieldValue.increment(-1) });

  await batch.commit();

  res.status(200).send();
});

exports.admin = functions.https.onRequest(adminApp);