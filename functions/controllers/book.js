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

  await db.collection("books").doc(user["title"]).set(user);

  res.status(201).send();
});

bookApp.put("/:title", async (req, res) => {
  const body = req.body;

  await db.collection("books").doc(req.params.title).update(body);

  res.status(200).send();
});

exports.books = functions.https.onRequest(bookApp);