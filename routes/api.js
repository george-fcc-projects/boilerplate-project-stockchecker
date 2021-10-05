'use strict';

const fetch = require('node-fetch');
const Firestore = require('@google-cloud/firestore')
const admin = require("firebase-admin");

const db = new Firestore({
    projectId: 'fcc-infosec',
    keyFilename: './service-key.json'
})

const stockCollection = db.collection('stocks');
const ipCollection = db.collection('ipAddresses')


module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      let stock = req.query.stock;
      let like = req.query.like;
      let ip = req.headers.host;

      console.log(ip);

      if (typeof stock === "string") {
          let price = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${req.query.stock}/quote`);
          price = await price.json();
          price = price.latestPrice;
          let stockDoc = (await stockCollection.doc(stock).get())

          if (stockDoc.exists === false) {
              await stockDoc.ref.set({code: stock, likes: 0});
          }
          if (like) {
              let ipDoc = await ipCollection.doc(ip).get();
              if (ipDoc.exists) {
                  if (ipDoc.data().stocks.includes(stock)) {
                      console.log('Only one like per IP');
                  } else {
                      await ipDoc.ref.update({
                          stocks: admin.firestore.FieldValue.arrayUnion(stock)
                      })
                      await stockDoc.ref.update({likes: admin.firestore.FieldValue.increment(1)});
                  }
              } else {
                  await ipDoc.ref.set({stocks: [stock]});
                  await stockDoc.ref.update({likes: admin.firestore.FieldValue.increment(1)});
              }
          }

          let likes = (await stockCollection.doc(stock).get()).data().likes;
          console.log(stock, price, likes);
          res.json({
              stockData: {
                  stock,
                  price,
                  likes
              }});
      } else if (stock instanceof Array) {
          if (stock.length === 2) {
              console.log(stock)

              let stockDoc = undefined;
              for (let indStock of stock) {
                  stockDoc = (await stockCollection.doc(indStock).get())
                  if (stockDoc.exists === false) {
                      await stockDoc.ref.set({code: stock, likes: 0});
                  }
                  if (like) {
                      let ipDoc = await ipCollection.doc(ip).get();
                      if (ipDoc.exists) {
                          if (ipDoc.data().stocks.includes(indStock)) {
                              console.log('Only one like per IP');
                          } else {
                              await ipDoc.ref.update({
                                  stocks: admin.firestore.FieldValue.arrayUnion(indStock)
                              })
                              await stockDoc.ref.update({likes: admin.firestore.FieldValue.increment(1)});
                          }
                      } else {
                          await ipDoc.ref.set({stocks: [indStock]});
                          await stockDoc.ref.update({likes: admin.firestore.FieldValue.increment(1)});
                      }
                  }
              }

              let stockDoc1 = (await stockCollection.doc(stock[0]).get())
              let stockDoc2 = (await stockCollection.doc(stock[1]).get())

              let price1 = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${req.query.stock[0]}/quote`);
              price1 = await price1.json();
              price1 = price1.latestPrice;
              let likes1 = stockDoc1.data().likes;
              let price2 = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${req.query.stock[1]}/quote`);
              price2 = await price2.json();
              price2 = price2.latestPrice;
              let likes2 = stockDoc2.data().likes;
              let rel_likes1 = likes1 - likes2;
              let rel_likes2 = likes2 - likes1;
              res.json({
                  stockData: [
                      {
                          stock: stock[0],
                          price: price1,
                          rel_likes: rel_likes1
                      },
                      {
                          stock: stock[1],
                          price: price2,
                          rel_likes: rel_likes2
                      }
                  ]
              });
          } else {
              res.sendStatus(500);
          }
      }


    });
    
};
