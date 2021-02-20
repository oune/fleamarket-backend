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

    let sells = [];
    const collections = doc.collection("reservations").get();
    collections.forEach(collection => {
      console.log('Found subcollection with id:', collection.id);
    });

    books.push({ id, sells, ...data });
  });

  res.status(200).send(JSON.stringify(books));
});

bookApp.get("/test", async (req, res) => {
  const snapshot = await db.collection("users").doc("lee").collection("dsa").get();

  let datas = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    datas.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(datas));
});

bookApp.get("/test2", async (req, res) => {
  const snapshot = await db.collection("users").doc("lee").listCollections();

  let datas = [];
  snapshot.forEach((doc) => {
    let id = doc.id;

    datas.push({ id });
  });

  res.status(200).send(JSON.stringify(datas));
});

exports.books = functions.https.onRequest(bookApp);