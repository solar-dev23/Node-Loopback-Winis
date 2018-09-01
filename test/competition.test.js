const expect = require('chai').expect;
const moment = require('moment-timezone');
const app = require('../server/server');
const request = require('supertest')(app);

let CompetitionModel;
let UserModel;

describe('Competition', () => {
  beforeEach(async () => {
    CompetitionModel = app.models.competition;
    UserModel = app.models.user;
    await UserModel.deleteAll();
    await UserModel.create([
      {
        username: 'etac',
        winis: 50,
        diamonds: 10,
      }, {
        username: 'longx',
        winis: 50,
        diamonds: 20,
      }, {
        username: 'clong',
        winis: 50,
        diamonds: 30,
      },
    ]);
    await CompetitionModel.deleteAll();
    const [competition1] = await CompetitionModel.create([
      {
        prize: 'iPhone X',
        startDate: moment().add(7, 'days'),
        endDate: moment().add(14, 'days'),
        image: 'none',
      },
    ]);
  });

  after(async () => {
    await app.dataSources.db.connector.disconnect();
  });

  it('should return the next scheduled competition', (done) => {
    request
      .get('/api/competitions/nearest')
      .then((res) => {
        const status = res.body.status;
        expect(status).to.be.equal('pending');
        done();
      });
  });

  it('should return the currently running competition', (done) => {
    CompetitionModel.getStartOfDay = function () {
      return moment(new Date()).tz('UTC').startOf('day').add(8, 'days');
    };

    request
      .get('/api/competitions/nearest')
      .then((res) => {
        const status = res.body.status;
        expect(status).to.be.equal('running');
        done();
      });
  });

  it('should return nothing after the last competition', (done) => {
    CompetitionModel.getStartOfDay = function () {
      return moment(new Date()).tz('UTC').startOf('day').add(15, 'days');
    };

    request
      .get('/api/competitions/nearest')
      .then((res) => {
        const status = res.body.status;
        expect(status).to.be.equal('empty');
        done();
      });
  });

  it('should pick a winner of the competition', (done) => {
    CompetitionModel.getStartOfDay = function () {
      return moment(new Date()).tz('UTC').startOf('day')
        .add(15, 'days');
    };
    request
      .post('/api/competitions/pickWinner')
      .then((res) => {
        const { winner } = res.body;
        expect(winner.username).to.be.equal('clong');
        return UserModel.find();
      })
      .then((users) => {
        for (const user of users) {
          expect(user.diamonds).to.be.equal(0);
        }
        done();
      });
  });
});
