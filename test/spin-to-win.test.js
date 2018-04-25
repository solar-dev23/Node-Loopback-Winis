'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);

let accessToken, UserModel;

describe('Spin To Win', function() {
  beforeEach(async function() {
    UserModel = app.models.user;
    await UserModel.deleteAll();
    const user = await UserModel.create({
      'winis': 500,
      'scratches': 0,
      'spins': 1,
      'diamonds': 0,
    });
    accessToken = await user.createAccessToken();
  });

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Logic', function() {
    it('should substract the amount of spins for the user', function(done) {
      app.models.spinToWin.calculateSpin = () => {
        return '5_winis';
      };

      request
        .post('/api/spinsToWin/spin')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end(async (err, res) => {
          UserModel.findById(accessToken.userId)
            .then((storedUser) => {
              const resultUser = res.body.user;

              expect(res.statusCode).to.be.equal(200);
              expect(storedUser.spins).to.be.equal(resultUser.spins);
              expect(resultUser.spins).to.be.equal(0);
              done();
            })
            .catch(done);
        });
    });

    it('should keep the returned user and stored users in sync', function(done) {
      app.models.spinToWin.calculateSpin = () => {
        return '100_winis';
      };

      request
        .post('/api/spinsToWin/spin')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          UserModel.findById(accessToken.userId)
            .then((storedUser) => {
              const resultUser = res.body.user;

              expect(res.statusCode).to.be.equal(200);
              expect(storedUser.winis).to.be.equal(600);
              expect(resultUser.winis).to.be.equal(600);
              done();
            })
            .catch(done);
        });
    });

    it('should refuse to spin if the user has no spins left', function(done) {
      const unmute = mute();

      UserModel.findById(accessToken.userId)
        .then((user) => {
          return user.updateAttribute('spins', 0);
        })
        .then(() => {
          request
            .post('/api/spinsToWin/spin')
            .set('Authorization', accessToken.id)
            .end((err, res) => {
              expect(res.statusCode).to.be.equal(409);
              expect(res.body.error).to.not.be.a('null');
              unmute();
              done();
            });
        });
    });
  });

  describe('Prizes', function() {
    const prizes = [
      {'prize': 'diamond', 'result': {'diamonds': 1}},
      {'prize': 'double_spin', 'result': {'spins': 2}},
      {'prize': '100_winis', 'result': {'winis': 600}},
      {'prize': 'double_diamond', 'result': {'diamonds': 2}},
      {'prize': 'empty', 'result': {}},
      {'prize': '50_winis', 'result': {'winis': 550}},
      {'prize': 'double_scratch', 'result': {'scratches': 2}},
      {'prize': 'scratch', 'result': {'scratches': 1}},
      {'prize': 'spin', 'result': {'spins': 1}},
    ];

    prizes.forEach(function(roll) {
      it(`it should update a user when the user rolls ${roll.prize}`, function(done) {
        app.models.spinToWin.calculateSpin = () => {
          return roll.prize;
        };

        request
          .post('/api/spinsToWin/spin')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            const spinResult = res.body.spinResult;
            const responseUser = res.body.user;
            const expectedResult = roll.result;

            expect(res.statusCode).to.be.equal(200);
            expect(spinResult).to.be.equal(roll.prize);
            expect(responseUser).to.include(expectedResult);
            done();
          });
      });
    });
  });
});
