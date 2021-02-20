const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const reservationApp = express();

reservationApp.use(cors({ origin: true }));


exports.books = functions.https.onRequest(reservationApp);