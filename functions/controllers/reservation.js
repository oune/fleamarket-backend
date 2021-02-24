const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const reservationApp = express();

reservationApp.use(cors({ origin: true }));

function impossibleChange(fields) {
  return (req, res, next) => {
    const fails = [];
    for (const field of fields) {
      if (req.body[field]) {
        fails.push(field);
      }
    }
    if (fails.length == 1) {
      res.status(400).send(`${fails.join(',')} cannot be changed`);
    } else if (fails.length > 1) {
      res.status(400).send(`${fails.join(',')} cannot be changed`);
    } else {
      next();
    }
  };
}

reservationApp.put("/:id", impossibleChange(["password", "bookId", "isCancle", "title"]), async (req, res) => {
    const body = req.body;
  
    await db.collection("reservations").doc(req.params.id).update(body);
  
    res.status(200).send();
  });

exports.reservations = functions.https.onRequest(reservationApp);