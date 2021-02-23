const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const reservationApp = express();

reservationApp.use(cors({ origin: true }));

reservationApp.put("/:id", async (req, res) => {
    const body = req.body;
  
    await db.collection("reservations").doc(req.params.id).update(body);
  
    res.status(200).send();
  });

exports.reservations = functions.https.onRequest(reservationApp);