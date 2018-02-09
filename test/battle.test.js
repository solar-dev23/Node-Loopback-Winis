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

  beforeEach(async function() {
    UserModel = app.models.user;
    BattleModel = app.models.battle;
    await UserModel.deleteAll();
    await BattleModel.deleteAll();
    [challengerUser, opponentUser] = await UserModel.create([
      {
        winis: 50,
      }, {
        winis: 50,
      },
    ]);
    challengerAccessToken = await challengerUser.createAccessToken();
    opponentAccessToken = await opponentUser.createAccessToken();
  });

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  it('should start a new pending battle', function(done) {
    request
      .post('/api/battles/challange')
      .set('Authorization', challengerAccessToken.id)
      .expect('Content-Type', /json/)
      .send({
        game: 'test-game',
        opponentId: opponentUser.id,
        stake: 20,
      })
      .end((err, res) => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.body.game).to.be.equal('test-game');
        expect(res.body.challengerId).to.be.equal(challengerAccessToken.userId);
        expect(res.body.opponentId).to.be.equal(opponentAccessToken.userId);
        expect(res.body.status).to.be.equal('pending');
        expect(res.body.stake).to.be.equal(20);

        (async function() {
          const challenger = await UserModel.findById(challengerUser.id);
          const opponent = await UserModel.findById(opponentUser.id);
  
          expect(challenger.staked).to.be.equal(20);
          expect(opponent.staked).to.be.equal(20);
          done();
        });
      });
  });

  it('should fail to start a new pending battle with same user as challenger and opponent', function(done) {
    const unmute = mute();
    request
      .post('/api/battles/challange')
      .set('Authorization', challengerAccessToken.id)
      .expect('Content-Type', /json/)
      .send({
        game: 'test-game',
        opponentId: challengerUser.id,
        stake: 20,
      })
      .end((err, res) => {
        expect(res.statusCode).to.be.equal(409);
        unmute();
        done();
      });
  });
});
