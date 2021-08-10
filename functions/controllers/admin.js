const functions = require("firebase-functions");
const admin = require('firebase-admin');
const check = require('../controllers/middle');
const keyName = require('../controllers/getType');
const express = require("express");
const cors = require('cors');

const db = admin.firestore();
const adminApp = express();

adminApp.use(cors({ origin: true }));

// 도서 추가
adminApp.post("/books", check.requireField(["title", "publisher", "author"]), async (req, res) => {
    const user = req.body;
    user.stockCountA = 0;
    user.stockCountB = 0;
    user.stockCountC = 0;
    user.reservationCountA = 0;
    user.reservationCountB = 0;
    user.reservationCountC = 0;


    await db.collection("books").add(user);

    res.status(201).send();
});

// 도서 내용 수정
adminApp.put("/books/:id", check.impossibleField(["reservationCountA", "stockCountA", "reservationCountB", "stockCountB", "reservationCountC", "stockCountC"]), async (req, res) => {
    const body = req.body;

    await db.collection("books").doc(req.params.id).update(body);

    res.status(200).send();
});

// 도서 삭제
adminApp.delete("/books/:id", async (req, res) => {
    const batch = db.batch();

    const bookRef = await db.collection("books").doc(req.params.id);
    batch.delete(bookRef);

    const stockSnapshot = await db.collection("stocks").where("bookId", "==", req.params.id).get();
    stockSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    const reservationSnapshot = await db.collection("reservations").where("bookId", "==", req.params.id).get();
    reservationSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    res.status(200).send();
});

// 도서 재고 추가
adminApp.post("/books/:id/stocks", check.requireField(["name", "studentId", "price", "state"]), async (req, res) => {
    try {
        const stock = req.body;
        stock.bookId = req.params.id;
        stock.isSold = false;

        const batch = db.batch();

        const stockRef = db.collection("stocks").doc();
        batch.set(stockRef, stock);

        const json = {}
        json[keyName.getStockCountName(stock.state)] = admin.firestore.FieldValue.increment(1);

        const bookRef = db.collection("books").doc(req.params.id);
        batch.update(bookRef, json);

        await batch.commit();
    } catch (e) {
        console.log(e);
        res.status(400).send("오류 발생");
    }

    res.status(201).send();
});

// 재고 내용 수정
adminApp.put("/stocks/:id", check.impossibleField(["bookId", "state"]), async (req, res) => {
    const body = req.body;


    await db.collection("stocks").doc(req.params.id).update(body);

    res.status(200).send();
});

// 재고 삭제
adminApp.delete("/books/:bookId/stocks/:id", async (req, res) => {
    const batch = db.batch();

    const stockRef = db.collection("stocks").doc(req.params.id);
    batch.delete(stockRef);

    const bookRef = db.collection("books").doc(req.params.bookId);
    switch (stock.state) {
        case "A":
            batch.update(bookRef, { stockCountA: admin.firestore.FieldValue.increment(-1) });
            break;
        case "B":
            batch.update(bookRef, { stockCountB: admin.firestore.FieldValue.increment(-1) });
            break;
        case "C":
            batch.update(bookRef, { stockCountC: admin.firestore.FieldValue.increment(-1) });
            break;
    }
    await batch.commit();

    res.status(200).send();
});

// 예약 수정
adminApp.put("/reservations/:id", check.impossibleField(["bookId", "isCancel", "title"]), async (req, res) => {
    const reservationRef = db.collection("reservations").doc(req.params.id);
    const bcrypt = require('bcrypt');
    const body = req.body;
    const saltRounds = 10;

    if (Object.prototype.hasOwnProperty.call(body, "password")) {
        body.password = bcrypt.hashSync(body.password, saltRounds);
    }

    reservationRef.update(body);

    return res.status(200).send();
});

// 예약 취소
adminApp.delete("/books/:bookId/reservations/:id", async (req, res) => {
    const reservationRef = db.collection("reservations").doc(req.params.id);
    const bookRef = db.collection("books").doc(req.params.bookId);

    try {
        await db.runTransaction(async t => {
            const { isCancel, state } = await t.get(reservationRef).data();

            if (!isCancel) {
                await t.update(reservationRef, { "isCancel": true });

                switch (state) {
                    case "A":
                        await t.update(bookRef, { reservationCountA: admin.firestore.FieldValue.increment(-1) });
                        break;
                    case "B":
                        await t.update(bookRef, { reservationCountB: admin.firestore.FieldValue.increment(-1) });
                        break;
                    case "C":
                        await t.update(bookRef, { reservationCountC: admin.firestore.FieldValue.increment(-1) });
                        break;
                }
            } else {
                throw new Error("이미 취소된 예약");
            }
        });
    } catch (e) {
        if (e.message === "Cannot read property 'password' of undefined") {
            res.status(421).send("존재 하지 않는 문서 아이디");
        } else if (e.message === "이미 취소된 예약") {
            res.status(421).send("이미 취소된 예약");
        }
        else {
            console.log(e)
            res.status(421).send("알수없는 에러");
        }
    }
    res.status(200).send();
});

// 책상태 추가
adminApp.post("/books/:bookId/:condition", async (req, res) => {
    const condition = req.body;
    condition.bookId = req.params.bookId;
    condition.condition = req.params.condition;
    condition.stockCount = 0;
    condition.reservationCount = 0;

    await db.collection("conditions").add(condition);

    res.status(201).send();
});

// 책상태 수정
adminApp.put("/books/:bookId/:condition", check.impossibleField(["bookId", "isCancel", "title", "stockCount", "reservationCount"]), async (req, res) => {
    const body = req.body;

    await db.collection("conditions").doc(req.param.condition).update(body);

    res.status(200).send();
});

// 책상태 삭제
adminApp.delete("/books/:bookId/:conditionId", async (req, res) => {
    const batch = db.batch();
    const conditionId = req.params.conditionId;

    const conditionRef = await db.collection("conditions").doc(conditionId);
    batch.delete(conditionRef);

    const stockSnapshot = await db.collection("stocks").where("conditionId", "==", conditionId).get();
    stockSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    const reservationSnapshot = await db.collection("reservations").where("conditionId", "==", conditionId).get();
    reservationSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    res.status(200).send();
});

exports.admin = functions.https.onRequest(adminApp);