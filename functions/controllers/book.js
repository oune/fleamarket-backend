const functions = require("firebase-functions");
const admin = require('firebase-admin');
const check = require('../controllers/middle');
const express = require("express");
const cors = require('cors');

admin.initializeApp();

const db = admin.firestore();
const bookApp = express();

bookApp.use(cors({ origin: true }));

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
    if (Object.prototype.hasOwnProperty.call(query, "title")) {
      bookRef = bookRef.where("title", "==", query.title);
    }
    if (Object.prototype.hasOwnProperty.call(query, "auther")) {
      bookRef = bookRef.where("auther", "==", query.auther);
    }
    if (Object.prototype.hasOwnProperty.call(query, "publisher")) {
      bookRef = bookRef.where("publisher", "==", query.publisher);
    }
    if (Object.prototype.hasOwnProperty.call(query, "start") && Object.prototype.hasOwnProperty.call(query, "len")) {
      bookRef = bookRef.orderBy('title').startAfter(query.start).limit(Number(query.len));
    }
    return await bookRef.get();
  } catch (e) {
    console.log(e)
    return null;
  }
}

bookApp.get("/search", async (req, res) => {
  const text = req.query.text;
  const snapshot = await db.collection('books').get();
  const result = snapshot.docs.filter(doc => {
    const {title, author, publisher} = doc.data();
    return title.includes(text) || author.includes(text) || publisher.includes(text);
   }).map(doc => doc.data());
   
   console.log(result);
   res.json(result);
});

bookApp.post("/:bookId/reservations", check.requireField(["password", "name", "studentId", "time", "date", "title"]), async (req, res) => {
  const bookRef = db.collection("books").doc(req.params.bookId);
  const reservationRef = db.collection("reservations").doc();
  const bcrypt = require('bcrypt');
  const saltRounds = 10;

  try {
    await db.runTransaction(async t => {
      const doc = await t.get(bookRef);
      const resCount = doc.data().stockCount > doc.data().reservationCount;

      if (resCount) {
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

bookApp.delete("/:bookId/reservations/:id", async (req, res) => {
  const reservationRef = db.collection("reservations").doc(req.params.id);
  const bookRef = db.collection("books").doc(req.params.bookId);
  const bcrypt = require('bcrypt');
  const query = req.query;

  if (Object.keys(query).length === 0) {
    res.status(400).send("password require");
    return;
  }

  try {
    await db.runTransaction(async t => {
      const doc = await t.get(reservationRef);
      const res = await bcrypt.compare(query.password, doc.data().password);

      if (res) {
        await t.update(reservationRef, { "isCancle": true });
        await t.update(bookRef, { reservationCount: admin.firestore.FieldValue.increment(-1) });
      } else {
        throw new Error("비밀번호가 다름");
      }
    });
  } catch (e) {
    if (e.message === "비밀번호가 다름") {
      return res.status(421).send("비밀번호가 다름");
    } else if (e.message === "Cannot read property 'password' of undefined") {
      return res.status(421).send("존재 하지 않는 문서 아이디");
    }
    else {
      console.log(e)
      return res.status(421).send("알수없는 에러");
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