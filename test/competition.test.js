'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const request = require('supertest')(app);
const moment = require('moment-timezone');

let CompetitionModel;

describe('Competition', function() {
  beforeEach(async function() {
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

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  it('should return the next scheduled competition', function(done) {
    request
      .get('/api/competitions/nearest')
      .then((res) => {
        const status = res.body.status;
        expect(status).to.be.equal('pending');
        done();
      });
  });

  it('should return the currently running competition', function(done) {
    CompetitionModel.getStartOfDay = function() {
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

  it('should return nothing after the last competition', function(done) {
    CompetitionModel.getStartOfDay = function() {
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
