'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const async = require('async');
const request = require('supertest')(app);

describe('Battle', function() {
  let UserModel, BattleModel;
  let challengerUser, opponentUser;
  let challengerAccessToken, opponentAccessToken;

  beforeEach(async function () {
    UserModel = app.models.user;
    BattleModel = app.models.battle;
    await UserModel.deleteAll();
    await BattleModel.deleteAll();
    [challengerUser, opponentUser] = await UserModel.create([
      {
        winis: 50
      }, {
        winis: 50,
      }
    ]);
    challengerAccessToken = await challengerUser.createAccessToken();
    opponentAccessToken = await opponentUser.createAccessToken();
  });

  after(async function () {
    await app.dataSources.db.connector.disconnect();
  });

  it('should start a new pending battle', function(done) {

    request
      .post(`/api/battle/`)
      .set('Authorization', challengerUser.id)
      .expect('Content-Type', /json/)
      .send({

        challengerId: challengerUser.id,
        opponentId: opponentUser.id,
        stake: 20
      })
      .end((err, res) => {

        expect(res.statusCode).to.be.equal(200);
        expect(res.body).to.be.equal(ownerUser.id);
        done();
      });
  });
});
