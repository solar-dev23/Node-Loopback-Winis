'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);
const moment = require('moment-timezone');

let accessToken, UserModel, DailyWinModel, originalGetStartOfDayFunction;
describe('Daily-win-V2', async function() {
  let user;
  beforeEach(async function() {
    UserModel = app.models.user;
    DailyWinModel = app.models.dailyWin;
    DailyWinModel.getStartOfDay = function() {
      return moment(new Date()).tz(user.timezone).startOf('day').valueOf();
    };
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

  describe('nearest', function() {
    it('should get new daily win', function (done) {
      request
        .post('/api/daily-wins/nearest')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.body).to.be.contain({
            createdDate: new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString(),
            resetDate: new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString(),
            lastAllowedDay: 1,
            lastVisitDate: 0,
            version: 2,
            userId: accessToken.userId,
          });
          expect(res.body.prizes['1'].status).to.be.equal('allowed');
          expect(res.body.prizes['2'].status).to.be.equal('pending');
          expect(res.body.prizes['3'].status).to.be.equal('pending');
          expect(res.body.prizes['4'].status).to.be.equal('pending');
          expect(res.body.prizes['5'].status).to.be.equal('pending');
          expect(res.body.prizes['6'].status).to.be.equal('pending');
          expect(res.body.prizes['7'].status).to.be.equal('pending');
          expect(res.body.prizes['weekly'].status).to.be.equal('pending');
          expect(res.body.user.winis).to.be.equal(0);
          done();
        });
    });

    it('should mark last day and weekly as missed for missing days', function (done) {    
      request
        .post('/api/daily-wins/nearest')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then(() => {
          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000;
          };
      
          return request
                .post('/api/daily-wins/nearest')
                .set('Authorization', accessToken.id)
                .expect('Content-Type', /json/)
                .send();
        })
        .then((res) => {          
          expect(res.body).to.be.contain({
            createdDate: new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString(),
            resetDate: new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString(),
            lastAllowedDay: 1,
          });
          expect(res.body.prizes['1'].status).to.be.equal('allowed');
          expect(res.body.prizes['2'].status).to.be.equal('pending');
          expect(res.body.prizes['3'].status).to.be.equal('pending');
          expect(res.body.prizes['4'].status).to.be.equal('pending');
          expect(res.body.prizes['5'].status).to.be.equal('pending');
          expect(res.body.prizes['6'].status).to.be.equal('pending');
          expect(res.body.prizes['7'].status).to.be.equal('missed');
          expect(res.body.prizes['weekly'].status).to.be.equal('missed');
          expect(res.body.user.winis).to.be.equal(0);  
          
          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 6 * 24 * 60 * 60 * 1000;
          };
      
          return request
                .post('/api/daily-wins/nearest')
                .set('Authorization', accessToken.id)
                .expect('Content-Type', /json/)
                .send();        
        }).then((res) => {         
          expect(res.body.prizes['1'].status).to.be.equal('allowed');
          expect(res.body.prizes['2'].status).to.be.equal('missed');
          expect(res.body.prizes['3'].status).to.be.equal('missed');
          expect(res.body.prizes['4'].status).to.be.equal('missed');
          expect(res.body.prizes['5'].status).to.be.equal('missed');
          expect(res.body.prizes['6'].status).to.be.equal('missed');
          expect(res.body.prizes['7'].status).to.be.equal('missed');
          expect(res.body.prizes['weekly'].status).to.be.equal('missed');
          expect(res.body.user.winis).to.be.equal(0);
      
          done();
        });
    });

    it('should make new daily win if a week past', function (done) {    
      request
        .post('/api/daily-wins/nearest')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then(() => {
          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 7 * 24 * 60 * 60 * 1000;
          };
      
          return request
                .post('/api/daily-wins/nearest')
                .set('Authorization', accessToken.id)
                .expect('Content-Type', /json/)
                .send();
        })
        .then((res) => {          
          expect(res.body).to.be.contain({
            createdDate: new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            resetDate: new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 14 * 24 * 60 * 60 * 1000 - 1).toISOString(),
            lastAllowedDay: 1,
          });
          expect(res.body.prizes['1'].status).to.be.equal('allowed');
          expect(res.body.prizes['2'].status).to.be.equal('pending');
          expect(res.body.prizes['3'].status).to.be.equal('pending');
          expect(res.body.prizes['4'].status).to.be.equal('pending');
          expect(res.body.prizes['5'].status).to.be.equal('pending');
          expect(res.body.prizes['6'].status).to.be.equal('pending');
          expect(res.body.prizes['7'].status).to.be.equal('pending');
          expect(res.body.prizes['weekly'].status).to.be.equal('pending');
          expect(res.body.user.winis).to.be.equal(0);  
          
          done();    
        });
    });
  });

  describe('pick', function () {
    it('should reward prize if picked', function (done) {
      request
        .post('/api/daily-wins/nearest')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {      
          expect(res.body.lastVisitDate).to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString());
          expect(res.body.lastAllowedDay).to.be.equal(2);
          expect(res.body.prizes['1'].status).to.be.equal('picked');
          expect(res.body.prizes['2'].status).to.be.equal('allowed');
          expect(res.body.prizes['weekly'].status).to.be.equal('pending');
          expect(res.body.user.winis).to.be.equal(5);
          done();
        });
    });

    it('should encount error if double picked', function (done) {
      request
        .post('/api/daily-wins/nearest')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {          
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {
          expect(res.statusCode).to.be.equal(500);
          done();
        });
    });

    it("don't reward weekly prize if there is any missed day", function (done) {
      request
        .post('/api/daily-wins/nearest')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {        
          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 5 * 24 * 60 * 60 * 1000;
          };  

          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {        
          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 6 * 24 * 60 * 60 * 1000;
          };  

          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {
          expect(res.body.lastAllowedDay).to.be.equal(4);
          expect(res.body.prizes['1'].status).to.be.equal('picked');
          expect(res.body.prizes['2'].status).to.be.equal('picked');
          expect(res.body.prizes['3'].status).to.be.equal('picked');
          expect(res.body.prizes['4'].status).to.be.equal('missed');
          expect(res.body.prizes['5'].status).to.be.equal('missed');
          expect(res.body.prizes['6'].status).to.be.equal('missed');
          expect(res.body.prizes['7'].status).to.be.equal('missed');
          expect(res.body.prizes['weekly'].status).to.be.equal('missed');
          expect(res.body.user.winis).to.be.equal(15);
          expect(res.body.user.spins).to.be.equal(1);
          done();
        });
    });

    it('pick full week daily wins', function (done) {
      request
        .post('/api/daily-wins/nearest')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {   
          expect(res.body.lastAllowedDay).to.be.equal(2);
          expect(res.body.user.winis).to.be.equal(5);
          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 1 * 24 * 60 * 60 * 1000;
          };       
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {
          expect(res.body.lastAllowedDay).to.be.equal(3);
          expect(res.body.prizes['2'].status).to.be.equal('picked');
          expect(res.body.prizes['3'].status).to.be.equal('allowed');
          expect(res.body.prizes['weekly'].status).to.be.equal('pending');
          expect(res.body.user.winis).to.be.equal(15);

          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 2 * 24 * 60 * 60 * 1000;
          }; 
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {
          expect(res.body.lastAllowedDay).to.be.equal(4);
          expect(res.body.prizes['3'].status).to.be.equal('picked');
          expect(res.body.prizes['4'].status).to.be.equal('allowed');
          expect(res.body.prizes['weekly'].status).to.be.equal('pending');
          expect(res.body.user.winis).to.be.equal(15);
          expect(res.body.user.spins).to.be.equal(1);

          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 3 * 24 * 60 * 60 * 1000;
          }; 
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {
          expect(res.body.lastAllowedDay).to.be.equal(5);          
          expect(res.body.prizes['4'].status).to.be.equal('picked');
          expect(res.body.prizes['5'].status).to.be.equal('allowed');
          expect(res.body.prizes['weekly'].status).to.be.equal('pending');
          expect(res.body.user.winis).to.be.equal(40);
          expect(res.body.user.spins).to.be.equal(1);

          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 4 * 24 * 60 * 60 * 1000;
          }; 
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {
          expect(res.body.lastAllowedDay).to.be.equal(6);
          expect(res.body.prizes['5'].status).to.be.equal('picked');
          expect(res.body.prizes['6'].status).to.be.equal('allowed');
          expect(res.body.prizes['weekly'].status).to.be.equal('pending');
          expect(res.body.user.winis).to.be.equal(50);
          expect(res.body.user.diamonds).to.be.equal(1);
          expect(res.body.user.spins).to.be.equal(2);
          expect(res.body.user.scratches).to.be.equal(1);
          
          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 5 * 24 * 60 * 60 * 1000;
          }; 
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {
          expect(res.body.lastAllowedDay).to.be.equal(7);
          expect(res.body.prizes['6'].status).to.be.equal('picked');
          expect(res.body.prizes['7'].status).to.be.equal('allowed');
          expect(res.body.prizes['weekly'].status).to.be.equal('pending');
          expect(res.body.user.winis).to.be.equal(100);
          expect(res.body.user.diamonds).to.be.equal(1);
          expect(res.body.user.spins).to.be.equal(2);
          expect(res.body.user.scratches).to.be.equal(1);
          
          DailyWinModel.getStartOfDay = function() {
            return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 6 * 24 * 60 * 60 * 1000;
          }; 
          return request
            .post('/api/daily-wins/pick')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        }).then((res) => {
          expect(res.body.lastAllowedDay).to.be.equal(8);
          expect(res.body.prizes['7'].status).to.be.equal('picked');
          expect(res.body.prizes['weekly'].status).to.be.equal('picked');
          expect(res.body.user.winis).to.be.equal(100);
          expect(res.body.user.diamonds).to.be.equal(101);
          expect(res.body.user.spins).to.be.equal(2);
          expect(res.body.user.scratches).to.be.equal(2);
          
          done();
        });
    });
  });
});
