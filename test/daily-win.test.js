const chai = require('chai');
const mute = require('mute');
const moment = require('moment-timezone');
const app = require('../server/server');
const request = require('supertest')(app);
const deepAssign = require('object-assign-deep');
const { expect } = chai;

chai.use(require('chai-shallow-deep-equal'));

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

  describe('Version 1', () => {
    describe('Create', () => {
      it('should get new daily-win', (done) => {
        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body).to.be.shallowDeepEqual(require('./fixtures/daily-win/daily-win.json'));

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
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body).to.be.shallowDeepEqual(require('./fixtures/daily-win/daily-win.json'));

            done();
          });
      });
    });

    describe('Iterate', () => {
      it('should get prize for second day', (done) => {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = function () {
          return today;
        };

        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            today.add(1, 'day');
            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);
            const expectedResult = deepAssign({},
              require('./fixtures/daily-win/daily-win.json'),
              {
                prizes: {
                  1: { status: 'picked' },
                  2: { status: 'today' },
                },
                lastAllowedDay: 2,
                user: { winis: 15 },
              },
            );
            expect(res.body).to.be.shallowDeepEqual(expectedResult);

            done();
          });
      });

      it('should iterate throught full week', (done) => {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = function () {
          return today;
        };

        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            today.add(1, 'day');

            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            today.add(1, 'day');

            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            today.add(1, 'day');

            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            today.add(1, 'day');

            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            today.add(1, 'day');

            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            today.add(1, 'day');

            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);
            const expectedResult = deepAssign({},
              require('./fixtures/daily-win/daily-win.json'),
              {
                prizes: {
                  1: { status: 'picked' },
                  2: { status: 'picked' },
                  3: { status: 'picked' },
                  4: { status: 'picked' },
                  5: { status: 'picked' },
                  6: { status: 'picked' },
                  7: { status: 'today' },
                  weekly: { status: 'today' },
                },
                lastAllowedDay: 7,
                user: {
                  winis: 100,
                  spins: 2,
                  scratches: 2,
                  diamonds: 101,
                },
              },
            );
            expect(res.body).to.be.shallowDeepEqual(expectedResult);

            done();
          });
      });

      /* eslint-disable-next-line */
      it('should get prize only for second day after 6-day absence', function getSecondDayPrize(done) {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = function getStartOfDay() {
          return today;
        };

        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then(() => {
            today.add(6, 'days');

            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);

            const expectedResult = deepAssign({},
              require('./fixtures/daily-win/daily-win.json'),
              {
                prizes: {
                  1: { status: 'picked' },
                  2: { status: 'today' },
                },
                lastAllowedDay: 2,
                user: { winis: 15 },
              },
            );
            expect(res.body).to.be.shallowDeepEqual(expectedResult);

            done();
          });
      });

      it('should get new daily-win for next week', (done) => {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = function getStartOfDay() {
          return today;
        };

        request
          .post('/api/daily-wins/check')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            today.add(1, 'week');

            return request
              .post('/api/daily-wins/check')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            const createdDate = moment.tz(user.timezone).add(1, 'week').startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);

            const expectedResult = deepAssign({},
              require('./fixtures/daily-win/daily-win.json'),
              { user: { winis: 10 } },
            );
            expect(res.body).to.be.shallowDeepEqual(expectedResult);

            done();
          });
      });

      it('should get prize only for second day after 6-day absence and generate new daily-win on the next day',
        (done) => {
          const today = moment.tz(user.timezone).startOf('day');

          DailyWinModel.getStartOfDay = function getStartOfDay() {
            return today;
          };

          request
            .post('/api/daily-wins/check')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send()
            .then((res) => {
              today.add(6, 'days');

              return request
                .post('/api/daily-wins/check')
                .set('Authorization', accessToken.id)
                .expect('Content-Type', /json/)
                .send();
            })
            .then((res) => {
              const createdDate = moment.tz(user.timezone).startOf('day');
              const resetDate = createdDate.clone().add(6, 'days').endOf('day');

              expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
              expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
              expect(res.body.userId).to.be.equal(accessToken.userId);

              const expectedResult = deepAssign({},
                require('./fixtures/daily-win/daily-win.json'),
                {
                  prizes: {
                    1: { status: 'picked' },
                    2: { status: 'today' },
                  },
                  lastAllowedDay: 2,
                  user: { winis: 15 },
                },
              );
              expect(res.body).to.be.shallowDeepEqual(expectedResult);

              today.add(1, 'day');
              return request
                .post('/api/daily-wins/check')
                .set('Authorization', accessToken.id)
                .expect('Content-Type', /json/)
                .send();
            })
            .then((res) => {
              const createdDate = moment.tz(user.timezone).add(1, 'week').startOf('day');
              const resetDate = createdDate.clone().add(6, 'days').endOf('day');

              expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
              expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
              expect(res.body.userId).to.be.equal(accessToken.userId);

              const expectedResult = deepAssign({},
                require('./fixtures/daily-win/daily-win.json'),
                {
                  prizes: {
                    1: { status: 'today' },
                  },
                  lastAllowedDay: 1,
                  user: { winis: 20 },
                },
              );
              expect(res.body).to.be.shallowDeepEqual(expectedResult);

              done();
            });
        });
    });
  });

  describe('Version 2', () => {
    describe('get-board', () => {
      it('should get new daily win board', (done) => {
        request
          .post('/api/daily-wins/get-board')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body).to.be.shallowDeepEqual(require('./fixtures/daily-win/daily-win.v2.json'));

            done();
          });
      });

      it('should mark last day and weekly as missed for missing days', (done) => {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = () => {
          return today;
        };

        request
          .post('/api/daily-wins/get-board')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then(() => {
            today.add(1, 'day');

            return request
              .post('/api/daily-wins/get-board')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);

            const expectedResult = deepAssign({},
              require('./fixtures/daily-win/daily-win.v2.json'),
              {
                prizes: {
                  1: { status: 'allowed' },
                  7: { status: 'missed' },
                  weekly: { status: 'missed' },
                },
              },
            );
            expect(res.body).to.be.shallowDeepEqual(expectedResult);

            today.add(5, 'days');

            return request
              .post('/api/daily-wins/get-board')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            const expectedResult = deepAssign({},
              require('./fixtures/daily-win/daily-win.v2.json'),
              {
                prizes: {
                  1: { status: 'allowed' },
                  2: { status: 'missed' },
                  3: { status: 'missed' },
                  4: { status: 'missed' },
                  5: { status: 'missed' },
                  6: { status: 'missed' },
                  7: { status: 'missed' },
                  weekly: { status: 'missed' },
                },
              },
            );
            expect(res.body).to.be.shallowDeepEqual(expectedResult);
            done();
          });
      });

      it('should make new daily win if a week passed', (done) => {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = () => {
          return today;
        };

        request
          .post('/api/daily-wins/get-board')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then(() => {
            today.add(1, 'week');

            return request
              .post('/api/daily-wins/get-board')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          })
          .then((res) => {
            const createdDate = moment.tz(user.timezone).startOf('day').add(1, 'week');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);
            expect(res.body).to.be.shallowDeepEqual(require('./fixtures/daily-win/daily-win.v2.json'));

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
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.lastVisitDate)
              .to.be.equal(moment.tz(user.timezone).startOf('day').toISOString());
            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);
            const expectedResult = deepAssign({},
              require('./fixtures/daily-win/daily-win.v2.json'),
              {
                prizes: {
                  1: { status: 'today' },
                  2: { status: 'pending' },
                },
                lastAllowedDay: 2,
                user: {
                  winis: 5,
                },
              },
            );
            expect(res.body).to.be.shallowDeepEqual(expectedResult);

            done();
          });
      });

      it('should throw an error if double picked', (done) => {
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

      it("shouldn't reward weekly prize if there is any missed day", (done) => {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = () => {
          return today;
        };

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
            today.add(5, 'days');

            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            today.add(1, 'day');

            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            const createdDate = moment.tz(user.timezone).startOf('day');
            const resetDate = createdDate.clone().add(6, 'days').endOf('day');

            expect(res.body.lastVisitDate)
              .to.be.equal(moment.tz(user.timezone).startOf('day').add(6, 'days').toISOString());
            expect(res.body.createdDate).to.be.equal(createdDate.toISOString());
            expect(res.body.resetDate).to.be.equal(resetDate.toISOString());
            expect(res.body.userId).to.be.equal(accessToken.userId);
            const expectedResult = deepAssign({},
              require('./fixtures/daily-win/daily-win.v2.json'),
              {
                prizes: {
                  1: { status: 'picked' },
                  2: { status: 'picked' },
                  3: { status: 'today' },
                  4: { status: 'missed' },
                  5: { status: 'missed' },
                  6: { status: 'missed' },
                  7: { status: 'missed' },
                  weekly: { status: 'missed' },
                },
                lastAllowedDay: 4,
                user: {
                  winis: 15,
                  spins: 1,
                },
              },
            );
            expect(res.body).to.be.shallowDeepEqual(expectedResult);

            done();
          });
      });

      it('should return the proper board value when doing 2 calls day after day', done => {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = () => {
          return today;
        };

        request
          .post('/api/daily-wins/get-board')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(1);
            expect(res.body.prizes['1'].status).to.be.equal('allowed');

            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.prizes['1'].status).to.be.equal('today');
            expect(res.body.prizes['2'].status).to.be.equal('pending');
            // expect(res.body.lastAllowedDay).to.be.equal(1);
            expect(res.body.user.winis).to.be.equal(5);

            return request
              .post('/api/daily-wins/get-board')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            // expect(res.body.lastAllowedDay).to.be.equal(1);
            expect(res.body.prizes['1'].status).to.be.equal('today');
            expect(res.body.prizes['2'].status).to.be.equal('pending');

            today.add(1, 'day');
            return request
              .post('/api/daily-wins/get-board')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(2);
            expect(res.body.prizes['1'].status).to.be.equal('picked');
            expect(res.body.prizes['2'].status).to.be.equal('allowed');

            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then(res => {
            expect(res.body.lastAllowedDay).to.be.equal(2);
            expect(res.body.prizes['1'].status).to.be.equal('picked');
            expect(res.body.prizes['2'].status).to.be.equal('today');
            expect(res.body.prizes['2'].status).to.be.equal('pending');

            done();
          });
      });

      it('pick full week daily wins', (done) => {
        const today = moment.tz(user.timezone).startOf('day');

        DailyWinModel.getStartOfDay = () => {
          return today;
        };

        request
          .post('/api/daily-wins/get-board')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(1);
            expect(res.body.prizes['1'].status).to.be.equal('allowed');

            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(2);
            expect(res.body.user.winis).to.be.equal(5);

            today.add(1, 'day');
            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(3);
            expect(res.body.prizes['2'].status).to.be.equal('today');
            expect(res.body.prizes['3'].status).to.be.equal('pending');
            expect(res.body.prizes['weekly'].status).to.be.equal('pending');
            expect(res.body.user.winis).to.be.equal(15);

            today.add(1, 'day');
            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(4);
            expect(res.body.prizes['3'].status).to.be.equal('today');
            expect(res.body.prizes['4'].status).to.be.equal('pending');
            expect(res.body.prizes['weekly'].status).to.be.equal('pending');
            expect(res.body.user.winis).to.be.equal(15);
            expect(res.body.user.spins).to.be.equal(1);

            today.add(1, 'day');
            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(5);
            expect(res.body.prizes['4'].status).to.be.equal('today');
            expect(res.body.prizes['5'].status).to.be.equal('pending');
            expect(res.body.prizes['weekly'].status).to.be.equal('pending');
            expect(res.body.user.winis).to.be.equal(40);
            expect(res.body.user.spins).to.be.equal(1);

            today.add(1, 'day');
            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(6);
            expect(res.body.prizes['5'].status).to.be.equal('today');
            expect(res.body.prizes['6'].status).to.be.equal('pending');
            expect(res.body.prizes['weekly'].status).to.be.equal('pending');
            expect(res.body.user.winis).to.be.equal(50);
            expect(res.body.user.diamonds).to.be.equal(1);
            expect(res.body.user.spins).to.be.equal(2);
            expect(res.body.user.scratches).to.be.equal(1);

            today.add(1, 'day');
            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(7);
            expect(res.body.prizes['6'].status).to.be.equal('today');
            expect(res.body.prizes['7'].status).to.be.equal('pending');
            expect(res.body.prizes['weekly'].status).to.be.equal('pending');
            expect(res.body.user.winis).to.be.equal(100);
            expect(res.body.user.diamonds).to.be.equal(1);
            expect(res.body.user.spins).to.be.equal(2);
            expect(res.body.user.scratches).to.be.equal(1);

            today.add(1, 'day');
            return request
              .post('/api/daily-wins/pick')
              .set('Authorization', accessToken.id)
              .expect('Content-Type', /json/)
              .send();
          }).then((res) => {
            expect(res.body.lastAllowedDay).to.be.equal(8);
            expect(res.body.prizes['7'].status).to.be.equal('today');
            expect(res.body.prizes['weekly'].status).to.be.equal('today');
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
