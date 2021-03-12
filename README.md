# 금오공대 중고도서 예약 시스템

---
## Developer

- Book detail -> wooseong
- Else system -> bepyan
- admin page -> KiimDoHyun, nggoong
- Backend -> oune
---
## TODO
- [add] google login
- [add] security
---
front build
```
#testing
npm run serve
#or 
yarn serve

#build
npm run build
#or
yarn build
```
## firebase guide
- https://firebase.google.com/docs/guides?hl=ko
- https://cloud.google.com/firestore/docs?hl=ko


firebase tools
```
npm install -g firebase-tools
```

firebase deploy
```
# hosting deploy
firebase deploy --only hosting

# api server deploy
firebase deploy --only functions
```

firebase test
```
firebase emulators:start
```

## directory
### api functions
- functions/constrollers
- functions/index.js

