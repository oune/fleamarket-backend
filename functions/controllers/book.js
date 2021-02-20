const functions = require("firebase-functions");
const express = require("express");
const cors = require('cors');

const admin = require('firebase-admin');

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

exports.books = functions.https.onRequest(bookApp);