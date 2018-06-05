'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const request = require('supertest')(app);
const moment = require('moment-timezone');

describe('Competition', function() {
  beforeEach(async function() {
    const CompetitionModel = app.models.competition;
    await CompetitionModel.deleteAll();
    const [competition1, competition2] = await CompetitionModel.create([
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

  it('should return the next scheduled competition', function() {
    request
      .get('/competitions/next')
      .send()
      .then((res) => {
        expect()
      });
  });

  it('should return the currently running competition', function() {

  });
});
