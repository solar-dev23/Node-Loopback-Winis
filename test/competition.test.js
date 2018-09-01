const expect = require('chai').expect;
const moment = require('moment-timezone');
const app = require('../server/server');
const request = require('supertest')(app);

let CompetitionModel;

describe('Competition', () => {
  beforeEach(async () => {
    CompetitionModel = app.models.competition;
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
});
