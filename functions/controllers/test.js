const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const testApp = express();

testApp.use(cors({ origin: true }));

testApp.post("/books", async (req, res) => {
    const user = req.body;
    user.stockCount = 0;
    user.reservationCount = 0;

    await db.collection("books").add(user);

    res.status(201).send();
});

exports.test = functions.https.onRequest(testApp);