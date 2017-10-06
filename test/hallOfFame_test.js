'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server/server');
const should = chai.should();

chai.use(chaiHttp);

describe('Hall Of Fame', function() {
  before(function(done) {
    server.dataSources.db.connector.connect(function(err, db) {
      db.dropDatabase();

      const UserModel = server.models.user;

      UserModel.create([
        {
          username: 'test-user-1',
          winis: 25
        },
        {
          username: 'test-user-2',
          winis: 50
        },
        {
          username: 'test-user-3',
          winis: 600
        },
        {
          username: 'test-user-4',
          winis: 5
        },
        {
          username: 'test-user-5',
          winis: 0
        },
      ], function(err, result) {
        done();
      });
    });
  });

  it('should return a properly sorted result from users', function(done) {
    chai.request(server)
      .get('/api/hallOfFame')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.lengthOf(5);
        done();
      });
  });

  it('should just return something', function() {

  });
});
