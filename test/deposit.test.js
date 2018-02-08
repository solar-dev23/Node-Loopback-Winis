'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);
var md5 = require('md5');

describe('Deposit', function () {

  let accessToken, DepositModel;
  let ownerUser, tapjoyKey;
  let basicWinisAmount = 50;
  let secret_key;

  beforeEach(async function () {

    DepositModel = app.models.deposit;

    const UserModel = app.models.user;
    await UserModel.deleteAll();

    ownerUser = await UserModel.create({ winis: basicWinisAmount });
    secret_key = app.get('tapjoyKey');
  });

  after(async function () {
    await app.dataSources.db.connector.disconnect();
  });


  describe('Tapjoy', function () {
    let grantedWinis = parseInt(Math.random() * 100);
    let displayMultiplier = Math.random() * 10;
    let randomExternalId = parseInt(Math.random() * 1000).toString();
    it('should award a certain amount of winis for completing a mission', function (done) {
      const params = {
        "id": randomExternalId,
        "snuid": ownerUser.id,
        "currency": grantedWinis,
        "mac_address": "00-16-41-34-2C-A6",
        "display_multiplier": displayMultiplier,
        "verifier": md5(`${randomExternalId}:${ownerUser.id}:${grantedWinis}:${secret_key}`)
      };

      request
        .get(`/api/deposits/tapjoy`)
        .query(params)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.result).to.be.equal(true);
          expect(res.body.depositId).to.be.above(0);
          done();
        });
    });

    it('should return 403 status code because of invalid userId', function (done) {
      const params = {
        "id": randomExternalId,
        "snuid": ownerUser.id + '' + 1,
        "currency": grantedWinis,
        "mac_address": "00-16-41-34-2C-A6",
        "display_multiplier": displayMultiplier,
        "verifier": md5(`${randomExternalId}:${ownerUser.id + '' + 1}:${grantedWinis}:${secret_key}`)
      };

      const unmute = mute();
      request
        .get(`/api/deposits/tapjoy`)
        .query(params)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(403);
          unmute();
          done();
        });
    });

    it('should return 403 status code because of absent param \'verifier\'', function (done) {
      const params = {
        "snuid": ownerUser.id,
        "currency": grantedWinis,
        "mac_address": "00-16-41-34-2C-A6",
        "display_multiplier": displayMultiplier
      };

      const unmute = mute();
      request
        .get(`/api/deposits/tapjoy`)
        .query(params)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(403);
          unmute();
          done();
        });
    });

    it('should return 403 status code because of wrong param \'verifier\'', function (done) {
      const params = {
        "id": randomExternalId,
        "snuid": ownerUser.id,
        "currency": grantedWinis,
        "mac_address": "00-16-41-34-2C-A6",
        "display_multiplier": displayMultiplier,
        "verifier": "wrong"
      };

      const unmute = mute();
      request
        .get(`/api/deposits/tapjoy`)
        .query(params)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(403);
          unmute();
          done();
        });
    });


  });
});
