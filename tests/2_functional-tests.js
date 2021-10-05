const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', async function() {

    test('Viewing one stock', (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=MSFT')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.property(res.body.stockData, 'stock');
                assert.property(res.body.stockData, 'price');
                assert.property(res.body.stockData, 'likes');
                assert.equal(res.body.stockData.stock, 'MSFT');
                assert.isNumber(res.body.stockData.price);
                assert.isNumber(res.body.stockData.likes);
                done();
            })
    })

    test('Viewing one stock and liking it', (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=MSFT')
            .end((err, res) => {
                let prevLikes = res.body.stockData.likes;
                chai.request(server)
                    .get('/api/stock-prices?stock=MSFT&like=true')
                    .end((err1, res1) => {
                        assert.equal(res1.status, 200);
                        assert.property(res1.body.stockData, 'stock');
                        assert.property(res1.body.stockData, 'price');
                        assert.property(res1.body.stockData, 'likes');
                        assert.equal(res1.body.stockData.stock, 'MSFT');
                        assert.isNumber(res1.body.stockData.price);
                        assert.isNumber(res1.body.stockData.likes);
                        assert.equal(res1.body.stockData.likes, prevLikes + 1);
                        done();
                    })
            })
    })

    test('Liking one stock and liking it again', (done) => {
        let requester =  chai.request(server).keepOpen();


        requester.get('/api/stock-prices?stock=MSFT&like=true')
            .then(res => {
                requester.get('/api/stock-prices?stock=MSFT&like=true')
                    .then(res1 => {
                        requester.close();
                        assert.equal(res.body.stockData.likes, res1.body.stockData.likes);
                        done();
                    })

            })
    })

    test('Viewing two stocks', (done) => {
        let stocks = ['MSFT', 'AMZN']
        chai.request(server)
            .get('/api/stock-prices?stock=MSFT&stock=AMZN')
            .end((err, res) => {
                assert.equal(res.status, 200);
                assert.isArray(res.body.stockData);
                for (let i = 0; i < 2; i++) {
                    assert.property(res.body.stockData[i], 'stock');
                    assert.property(res.body.stockData[i], 'price');
                    assert.property(res.body.stockData[i], 'rel_likes');
                    assert.equal(res.body.stockData[i].stock, stocks[i]);
                    assert.isNumber(res.body.stockData[i].price);
                    assert.isNumber(res.body.stockData[i].rel_likes);
                }
                done();
            })
    })

    test('Viewing two stocks and liking them', (done) => {
        chai.request(server)
            .get('/api/stock-prices?stock=MSFT&stock=AMZN')
            .end((err, res) => {
                assert.equal(res.status, 200);
                chai.request(server)
                    .get('/api/stock-prices?stock=MSFT&stock=AMZN&like=true')
                    .end((err1, res1) => {
                        assert.equal(res1.status, 200);
                        assert.isArray(res1.body.stockData);
                        assert.equal(Math.abs(res1.body.stockData[0].rel_likes), Math.abs(res.body.stockData[0].rel_likes))
                        assert.equal(Math.abs(res1.body.stockData[1].rel_likes), Math.abs(res.body.stockData[1].rel_likes))
                        done();
                    })
            })
    }).timeout(10000)

});
