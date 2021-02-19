const functions = require("firebase-functions");
const express = require("express");
const cors = require('cors');

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const app = express();

app.get("/", async (req, res) => {
    const snapshot = await db.collection("users").get();
  
    let users = [];
    snapshot.forEach((doc) => {
      let id = doc.id;
      let data = doc.data();
  
      users.push({ id, ...data });
    });
  
    res.status(200).send(JSON.stringify(users));
});

app.post('/', async (req, res) => {
    const user = req.body;

    await db.collection('users').add(user);

    res.status(201).send();
})

exports.user = functions.https.onRequest(app);

const appBook = express();

appBook.get("/", async (req, res) => {
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

appBook.get("/test", async (req, res) => {
  const snapshot = await db.collection("users").doc("lee").collection("dsa").get();

  let datas = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    datas.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(datas));
});

appBook.get("/test2", async (req, res) => {
  const snapshot = await db.collection("users").doc("lee").listCollections();

  let datas = [];
  snapshot.forEach((doc) => {
    let id = doc.id;

    datas.push({ id });
  });

  res.status(200).send(JSON.stringify(datas));
});

exports.books = functions.https.onRequest(appBook);