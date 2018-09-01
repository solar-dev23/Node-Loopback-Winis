const expect = require('chai').expect;
const mute = require('mute');
const moment = require('moment-timezone');
const app = require('../server/server');
const request = require('supertest')(app);

let accessToken,
  UserModel,
  DailyWinModel,
  originalGetStartOfDayFunction;

describe('Daily-win', async () => {
  let user;
  beforeEach(async () => {
    UserModel = app.models.user;
    DailyWinModel = app.models.dailyWin;
    DailyWinModel.getStartOfDay = function () {
      return moment(new Date()).tz(user.timezone).startOf('day').valueOf();
    };
    await UserModel.deleteAll();
    user = await UserModel.create({
      winis: 0,
      scratches: 0,
      spins: 0,
      diamonds: 0,
      timezone: 'Asia/Jerusalem',
    });
    accessToken = await user.createAccessToken();
  });

  after(async () => {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Legacy version', () => {
    describe('Create', () => {
      it('should get new daily-win', (done) => {
        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            expect(res.body.createdDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString());
            expect(res.body.resetDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString());
            expect(res.body.lastAllowedDay).to.be.equal(1);
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body.prizes['1'].status).to.be.equal('today');
            expect(res.body.prizes['2'].status).to.be.equal('skipped');
            expect(res.body.prizes['3'].status).to.be.equal('skipped');
            expect(res.body.prizes['4'].status).to.be.equal('skipped');
            expect(res.body.prizes['5'].status).to.be.equal('skipped');
            expect(res.body.prizes['6'].status).to.be.equal('skipped');
            expect(res.body.prizes['7'].status).to.be.equal('skipped');
            expect(res.body.prizes.weekly.status).to.be.equal('skipped');
            expect(res.body.user.winis).to.be.equal(5);
            done();
          });
      });

      it('should get same daily-win for second check', (done) => {
        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then(res => request
            .post('/api/daily-wins/check')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send())
          .then((res) => {
            expect(res.body.createdDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString());
            expect(res.body.resetDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString());
            expect(res.body.lastAllowedDay).to.be.equal(1);
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body.prizes['1'].status).to.be.equal('today');
            expect(res.body.prizes['2'].status).to.be.equal('skipped');
            expect(res.body.prizes['3'].status).to.be.equal('skipped');
            expect(res.body.prizes['4'].status).to.be.equal('skipped');
            expect(res.body.prizes['5'].status).to.be.equal('skipped');
            expect(res.body.prizes['6'].status).to.be.equal('skipped');
            expect(res.body.prizes['7'].status).to.be.equal('skipped');
            expect(res.body.prizes.weekly.status).to.be.equal('skipped');
            expect(res.body.user.winis).to.be.equal(5);
            done();
          });
      });
    });

    describe('Iterate', () => {
      it('should get prize for second day', (done) => {
        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            DailyWinModel.getStartOfDay = function () {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            expect(res.body.createdDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString());
            expect(res.body.resetDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString());
            expect(res.body.lastAllowedDay).to.be.equal(2);
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body.prizes['1'].status).to.be.equal('picked');
            expect(res.body.prizes['2'].status).to.be.equal('today');
            expect(res.body.prizes['3'].status).to.be.equal('skipped');
            expect(res.body.prizes['4'].status).to.be.equal('skipped');
            expect(res.body.prizes['5'].status).to.be.equal('skipped');
            expect(res.body.prizes['6'].status).to.be.equal('skipped');
            expect(res.body.prizes['7'].status).to.be.equal('skipped');
            expect(res.body.prizes.weekly.status).to.be.equal('skipped');
            expect(res.body.user.winis).to.be.equal(15);
            done();
          });
      });

      it('should iterate throught full week', (done) => {
        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            DailyWinModel.getStartOfDay = function () {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 1;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            DailyWinModel.getStartOfDay = function () {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 2;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            DailyWinModel.getStartOfDay = function () {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 3;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            DailyWinModel.getStartOfDay = function () {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 4;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            DailyWinModel.getStartOfDay = function () {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 5;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            DailyWinModel.getStartOfDay = function () {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 6;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            expect(res.body.createdDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString());
            expect(res.body.resetDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString());
            expect(res.body.lastAllowedDay).to.be.equal(7);
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body.prizes['1'].status).to.be.equal('picked');
            expect(res.body.prizes['2'].status).to.be.equal('picked');
            expect(res.body.prizes['3'].status).to.be.equal('picked');
            expect(res.body.prizes['4'].status).to.be.equal('picked');
            expect(res.body.prizes['5'].status).to.be.equal('picked');
            expect(res.body.prizes['6'].status).to.be.equal('picked');
            expect(res.body.prizes['7'].status).to.be.equal('today');
            expect(res.body.prizes.weekly.status).to.be.equal('today');
            expect(res.body.user.winis).to.be.equal(100);
            expect(res.body.user.spins).to.be.equal(2);
            expect(res.body.user.scratches).to.be.equal(2);
            expect(res.body.user.diamonds).to.be.equal(101);
            done();
          });
      });

      /* eslint-disable-next-line */
      it('should get prize only for second day after 6-day absence', function getSecondDayPrize(done) {
        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then(() => {
            DailyWinModel.getStartOfDay = function getStartOfDay() {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 6;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            expect(res.body.createdDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString());
            expect(res.body.resetDate).to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
              .valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString());
            expect(res.body.lastAllowedDay).to.be.equal(2);
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body.prizes['1'].status).to.be.equal('picked');
            expect(res.body.prizes['2'].status).to.be.equal('today');
            expect(res.body.prizes['3'].status).to.be.equal('skipped');
            expect(res.body.prizes['4'].status).to.be.equal('skipped');
            expect(res.body.prizes['5'].status).to.be.equal('skipped');
            expect(res.body.prizes['6'].status).to.be.equal('skipped');
            expect(res.body.prizes['7'].status).to.be.equal('skipped');
            expect(res.body.prizes.weekly.status).to.be.equal('skipped');
            expect(res.body.user.winis).to.be.equal(15);
            expect(res.body.user.spins).to.be.equal(0);
            expect(res.body.user.scratches).to.be.equal(0);
            expect(res.body.user.diamonds).to.be.equal(0);
            done();
          });
      });

      it('should get new daily-win for next week', (done) => {
        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            DailyWinModel.getStartOfDay = function () {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 7;
            };
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            expect(res.body.createdDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 7 * 24 * 60 * 60 * 1000).toISOString());
            expect(res.body.resetDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 14 * 24 * 60 * 60 * 1000 - 1).toISOString());
            expect(res.body.lastAllowedDay).to.be.equal(1);
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body.prizes['1'].status).to.be.equal('today');
            expect(res.body.prizes['2'].status).to.be.equal('skipped');
            expect(res.body.prizes['3'].status).to.be.equal('skipped');
            expect(res.body.prizes['4'].status).to.be.equal('skipped');
            expect(res.body.prizes['5'].status).to.be.equal('skipped');
            expect(res.body.prizes['6'].status).to.be.equal('skipped');
            expect(res.body.prizes['7'].status).to.be.equal('skipped');
            expect(res.body.prizes.weekly.status).to.be.equal('skipped');
            expect(res.body.user.winis).to.be.equal(10);
            expect(res.body.user.spins).to.be.equal(0);
            expect(res.body.user.scratches).to.be.equal(0);
            expect(res.body.user.diamonds).to.be.equal(0);
            done();
          });
      });

      it('should get prize only for second day after 6-day absence and generate new daily-win on the next day',
        (done) => {
          request
            .post('/api/daily-wins/check')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send()
            .then((res) => {
              DailyWinModel.getStartOfDay = function () {
                return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 6;
              };
              return request
                .post('/api/daily-wins/check')
                .set('Authorization', accessToken.id)
                .expect('Content-Type', /json/)
                .send();
            })
            .then((res) => {
              expect(res.body.createdDate)
                .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString());
              expect(res.body.resetDate)
                .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                  .valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString());
              expect(res.body.lastAllowedDay).to.be.equal(2);
              expect(res.body.userId).to.be.equal(accessToken.userId);
              expect(res.body.prizes['1'].status).to.be.equal('picked');
              expect(res.body.prizes['2'].status).to.be.equal('today');
              expect(res.body.prizes['3'].status).to.be.equal('skipped');
              expect(res.body.prizes['4'].status).to.be.equal('skipped');
              expect(res.body.prizes['5'].status).to.be.equal('skipped');
              expect(res.body.prizes['6'].status).to.be.equal('skipped');
              expect(res.body.prizes['7'].status).to.be.equal('skipped');
              expect(res.body.prizes.weekly.status).to.be.equal('skipped');
              expect(res.body.user.winis).to.be.equal(15);
              expect(res.body.user.spins).to.be.equal(0);
              expect(res.body.user.scratches).to.be.equal(0);
              expect(res.body.user.diamonds).to.be.equal(0);

              DailyWinModel.getStartOfDay = function () {
                return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000 * 7;
              };

              return request
                .post('/api/daily-wins/check')
                .set('Authorization', accessToken.id)
                .expect('Content-Type', /json/)
                .send();
            })
            .then((res) => {
              expect(res.body.createdDate)
                .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                  .valueOf() + 7 * 24 * 60 * 60 * 1000).toISOString());
              expect(res.body.resetDate)
                .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day')
                  .valueOf() + 14 * 24 * 60 * 60 * 1000 - 1).toISOString());
              expect(res.body.lastAllowedDay).to.be.equal(1);
              expect(res.body.userId).to.be.equal(accessToken.userId);
              expect(res.body.prizes['1'].status).to.be.equal('today');
              expect(res.body.prizes['2'].status).to.be.equal('skipped');
              expect(res.body.prizes['3'].status).to.be.equal('skipped');
              expect(res.body.prizes['4'].status).to.be.equal('skipped');
              expect(res.body.prizes['5'].status).to.be.equal('skipped');
              expect(res.body.prizes['6'].status).to.be.equal('skipped');
              expect(res.body.prizes['7'].status).to.be.equal('skipped');
              expect(res.body.prizes.weekly.status).to.be.equal('skipped');
              expect(res.body.user.winis).to.be.equal(20);
              expect(res.body.user.spins).to.be.equal(0);
              expect(res.body.user.scratches).to.be.equal(0);
              expect(res.body.user.diamonds).to.be.equal(0);
              done();
            });
        });
    });
  });

  describe('Split version', () => {
    describe('get-board', () => {
      it('should get new daily win', (done) => {
        request
          .post('/api/daily-wins/get-board')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            expect(res.body).to.be.contain({
              createdDate: new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString(),
              resetDate: new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString(),
              lastAllowedDay: 1,
              lastVisitDate: 0,
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

      it('should mark last day and weekly as missed for missing days', (done) => {
        request
          .post('/api/daily-wins/get-board')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then(() => {
            DailyWinModel.getStartOfDay = () => {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 24 * 60 * 60 * 1000;
            };

            return request
              .post('/api/daily-wins/get-board')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            expect(res.body).to.be.contain({
              createdDate: new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString(),
              resetDate: new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 7 * 24 * 60 * 60 * 1000 - 1).toISOString(),
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

            DailyWinModel.getStartOfDay = () => {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 6 * 24 * 60 * 60 * 1000;
            };

            return request
              .post('/api/daily-wins/get-board')
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

      it('should make new daily win if a week past', (done) => {
        request
          .post('/api/daily-wins/get-board')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then(() => {
            DailyWinModel.getStartOfDay = () => {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 7 * 24 * 60 * 60 * 1000;
            };

            return request
              .post('/api/daily-wins/get-board')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            expect(res.body).to.be.contain({
              createdDate: new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              resetDate: new Date(moment(new Date()).tz(user.timezone).startOf('day')
                .valueOf() + 14 * 24 * 60 * 60 * 1000 - 1).toISOString(),
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

    describe('pick', () => {
      it('should reward prize if picked', (done) => {
        request
          .post('/api/daily-wins/get-board')
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
            expect(res.body.lastVisitDate)
              .to.be.equal(new Date(moment(new Date()).tz(user.timezone).startOf('day').valueOf()).toISOString());
            expect(res.body.lastAllowedDay).to.be.equal(2);
            expect(res.body.prizes['1'].status).to.be.equal('picked');
            expect(res.body.prizes['2'].status).to.be.equal('allowed');
            expect(res.body.prizes['weekly'].status).to.be.equal('pending');
            expect(res.body.user.winis).to.be.equal(5);
            done();
          });
      });

      it('should encount error if double picked', (done) => {
        const unmute = mute();
        request
          .post('/api/daily-wins/get-board')
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
            unmute();
            done();
          });
      });

      it("don't reward weekly prize if there is any missed day", (done) => {
        request
          .post('/api/daily-wins/get-board')
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
            DailyWinModel.getStartOfDay = () => {
              return moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 5 * 24 * 60 * 60 * 1000;
            };

            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            DailyWinModel.getStartOfDay = () => {
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

      it('pick full week daily wins', (done) => {
        request
          .post('/api/daily-wins/get-board')
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
            DailyWinModel.getStartOfDay = () => {
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

            DailyWinModel.getStartOfDay = () => {
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

            DailyWinModel.getStartOfDay = () => {
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

            DailyWinModel.getStartOfDay = () => {
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

            DailyWinModel.getStartOfDay = () => {
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

            DailyWinModel.getStartOfDay = () => {
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
});
