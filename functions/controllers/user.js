const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const userApp = express();

userApp.use(cors({ origin: true }));

userApp.get("/:studentId/reservations", async (req, res) => {
    const snapshot = await db.collection("reservations").where("studentId", "==", req.params.studentId).where("isCancle", "==", false).get();
  
    let reservations = [];
    snapshot.forEach((doc) => {
      let id = doc.id;
      let data = doc.data();
  
      reservations.push({ id, ...data });
    });
  
    res.status(200).send(JSON.stringify(reservations));
  });

exports.users = functions.https.onRequest(userApp);