'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);
const moment = require('moment-timezone');

let accessToken, UserModel, DailyWinModel;

describe('Daily-win', async function() {
  let user;
  beforeEach(async function() {
    UserModel = app.models.user;
    DailyWinModel = app.models.dailyWin;
    await UserModel.deleteAll();
    user = await UserModel.create({
      'winis': 0,
      'scratches': 0,
      'spins': 0,
      'diamonds': 0,
      'timezone': 'Asia/Jerusalem',
    });
    accessToken = await user.createAccessToken();
  });

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Unified', function() {
    it('should generate new daily-win', function(done) {
      request
        .post('/api/daily-wins/check')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.body.createdDate).to.be.equal(moment(new Date()).tz(user.timezone).startOf('day').valueOf());
          expect(res.body.resetDate).to.be.equal(moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 7 * 24 * 60 * 60 * 1000 - 1);
          expect(res.body.lastAllowedDay).to.be.equal(1);
          expect(res.body.userId).to.be.equal(accessToken.userId);
          expect(res.body.prizes['1'].status).to.be.equal('picked');
          expect(res.body.prizes['2'].status).to.be.equal('disallowed');
          expect(res.body.prizes['3'].status).to.be.equal('disallowed');
          expect(res.body.prizes['4'].status).to.be.equal('disallowed');
          expect(res.body.prizes['5'].status).to.be.equal('disallowed');
          expect(res.body.prizes['6'].status).to.be.equal('disallowed');
          expect(res.body.prizes['7'].status).to.be.equal('disallowed');
          expect(res.body.prizes['weekly'].status).to.be.equal('disallowed');
          return UserModel.findById(accessToken.userId);
        })
        .then((user)=>{
          expect(user.winis).to.be.equal(5);
          done();
        });
    });

  //   it('should get reward for second day', function(done) {
  //     request
  //       .post('/api/daily-wins/check')
  //       .set('Authorization', accessToken.id)
  //       .expect('Content-Type', /json/)
  //       .send()
  //       .then((res) => {
  //         return DailyWinModel.findById(res.body.id);
  //       })
  //       .then((dailyWin)=>{
  //         return dailyWin.updateAttribute('lastVisitDate', moment(new Date()).tz(user.timezone).startOf('day').valueOf() - 24 * 60 * 60 * 1000);
  //       })
  //       .then((dailyWin)=>{
  //         return request
  //         .post('/api/daily-wins/check')
  //         .set('Authorization', accessToken.id)
  //         .expect('Content-Type', /json/)
  //         .send();
  //       })
  //       .then((res) => {
  //         expect(res.body.createdDate).to.be.equal(moment(new Date()).tz(user.timezone).startOf('day').valueOf());
  //         expect(res.body.resetDate).to.be.equal(moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 7 * 24 * 60 * 60 * 1000 - 1);
  //         expect(res.body.lastVisitDate).to.be.equal(moment(new Date()).tz(user.timezone).startOf('day').valueOf() - 24 * 60 * 60 * 1000);
  //         expect(res.body.lastAllowedDay).to.be.equal(2);
  //         expect(res.body.userId).to.be.equal(accessToken.userId);
  //         expect(res.body.prizes['1'].status).to.be.equal('picked');
  //         expect(res.body.prizes['2'].status).to.be.equal('picked');
  //         expect(res.body.prizes['3'].status).to.be.equal('disallowed');
  //         expect(res.body.prizes['4'].status).to.be.equal('disallowed');
  //         expect(res.body.prizes['5'].status).to.be.equal('disallowed');
  //         expect(res.body.prizes['6'].status).to.be.equal('disallowed');
  //         expect(res.body.prizes['7'].status).to.be.equal('disallowed');
  //         expect(res.body.prizes['weekly'].status).to.be.equal('disallowed');
  //         return UserModel.findById(accessToken.userId);
  //       })
  //       .then((user)=>{
  //         expect(user.winis).to.be.equal(15);
  //         done();
  //       });
  //   });
  // });

  
});
