// const functions = require("firebase-functions");
// const admin = require('firebase-admin');
// const express = require("express");
// const cors = require('cors');

// const db = admin.firestore();
// const testApp = express();

// testApp.use(cors({ origin: true }));

// testApp.get("/", async (req, res) => {
//     const body = req.body;
//     const query = req.query;
//     const list = [];

//     list.push(body.name);
//     list.push(query.name);

//     console.log(query);

//     res.status(200).send(JSON.stringify(list));
// });

// testApp.post("/", async (req, res) => {
//     try {
//         await db.runTransaction(async t => {
//             if (true) {
//                 res.status(422).send("트랜잭션 실패");
//             }
//         });
//     } catch (e) {
//         res.status(421).send("트랜잭션 실패");
//     }
//     res.status(201).send();
// });

// testApp.get("/1", async (req, res) => {
//     const bcrypt = require('bcrypt');
//     const saltRounds = 10;
//     const myPlaintextPassword = 's0/\/\P4$$w0rD';
//     const someOtherPlaintextPassword = 'not_bacon';

//     bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
//         console.log(hash);
//     });

//     const newHash = "$2b$10$abemamvhTRe39/nQF6DqjuS/tUTmDOzLeAutJsOCrXtvg7Miql5WO"
    

//     bcrypt.compare(myPlaintextPassword, newHash, function(err, result) {
//         // result == true
//         console.log(result);
//     });
//     bcrypt.compare(someOtherPlaintextPassword, newHash, function(err, result) {
//         // result == false
//         console.log(result);
//     });

//     res.status(200).send();
// });

// exports.test = functions.https.onRequest(testApp);