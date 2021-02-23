const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const cors = require('cors');

admin.initializeApp();

const db = admin.firestore();
const bookApp = express();

bookApp.use(cors({ origin: true }));

function checkField(fields) {
  return (req, res, next) => {
    const fails = [];
    for (const field of fields) {
      if (!req.body[field]) {
        fails.push(field);
      }
    }
    if (fails.length == 1) {
      res.status(400).send(`${fails.join(',')} is required`);
    } else if (fails.length > 1) {
      res.status(400).send(`${fails.join(',')} are required`);
    } else {
      next();
    }
  };
}

bookApp.get("/", async (req, res) => {
  const query = req.query;
  const snapshot = await getSnapshot(query);

  if (snapshot === null) {
    res.status(400).send("올바르지 않은 쿼리");
  } else {
    let books = [];
    snapshot.forEach((doc) => {
      let id = doc.id;
      let data = doc.data();

      books.push({ id, ...data });
    });

    res.status(200).send(JSON.stringify(books));
  }
});

async function getSnapshot(query) {
  try {
    let bookRef = db.collection("books");
    if (Object.keys(query).length !== 0) {
      if (query.hasOwnProperty("title")) {
        bookRef = bookRef.where("title", "==", query.title);
      }
      if (query.hasOwnProperty("auther")) {
        bookRef = bookRef.where("auther", "==", query.auther);
      }
      if (query.hasOwnProperty("publisher")) {
        bookRef = bookRef.where("publisher", "==", query.publisher);
      }
    }

    return await bookRef.get();
  } catch (e) {
    console.log(e)
    return null;
  }
}

bookApp.post("/:bookId/reservations", checkField(["password", "name", "studentId", "time", "title"]), async (req, res) => {
  const bookRef = db.collection("books").doc(req.params.bookId);
  const reservationRef = db.collection("reservations").doc();
  const bcrypt = require('bcrypt');
  const saltRounds = 10;

  try {
    await db.runTransaction(async t => {
      const doc = await t.get(bookRef);
      const resCount = doc.data().stockCount - doc.data().reservationCount;

      if (resCount > 0) {
        const reservation = req.body;
        reservation.bookId = req.params.bookId;
        reservation.isCancle = false;
        reservation.password = bcrypt.hashSync(reservation.password, saltRounds);

        await t.set(reservationRef, reservation);
        await t.update(bookRef, { reservationCount: admin.firestore.FieldValue.increment(1) });
      } else {
        throw new Error("no stock");
      }

    });
  } catch (e) {
    if (e.message === "no stock") {
      res.status(421).send("남은 재고 없음");
    } else if (e.message === "Cannot read property 'stockCount' of undefined") {
      res.status(421).send("문서가 존재 하지 않음");
    } else {
      console.log(e);
      res.status(421).send("알수없는 에러");
    }
  }
  res.status(201).send();
});

bookApp.get("/:bookId/reservations", async (req, res) => {
  const snapshot = await db.collection("reservations").where("bookId", "==", req.params.bookId).where("isCancle", "==", false).get();

  let reservations = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    reservations.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(reservations));
});

bookApp.delete("/:bookId/reservations/:id/:password", async (req, res) => {// 구조를 더 좋게 할수 있지 않을까?
  const reservationRef = db.collection("reservations").doc(req.params.id);
  const bookRef = db.collection("books").doc(req.params.bookId);
  const bcrypt = require('bcrypt');

  try {
    await db.runTransaction(async t => {
      const doc = await t.get(reservationRef);
      const res = bcrypt.compareSync(req.params.password, doc.data().password);

      if (res) {
        await t.update(reservationRef, { "isCancle": true });
        await t.update(bookRef, { reservationCount: admin.firestore.FieldValue.increment(-1) });
      } else {
        throw new Error("비밀번호가 다름");
      }
    });
  } catch (e) {
    if (e.message === "비밀번호가 다름") {
      res.status(421).send("비밀번호가 다름");
    } else {
      console.log(e)
      res.status(421).send("알수없는 에러");
    }
  }

  res.status(200).send();
});

bookApp.get("/:bookId/stocks", async (req, res) => {
  const snapshot = await db.collection("stocks").where("bookId", "==", req.params.bookId).get();

  let stocks = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    stocks.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(stocks));
});

exports.books = functions.https.onRequest(bookApp);