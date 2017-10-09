'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const request = require('supertest')(app);

describe('Hall Of Fame', function() {
  let accessToken;
  before(async () => {
    const UserModel = app.models.user;
    await UserModel.deleteAll();

    const users = await UserModel.create([
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
        winis: 650
      },
      {
        username: 'test-user-4',
        winis: 5
      },
      {
        username: 'test-user-5',
        winis: 0
      },
    ]);

    const [firstUser, secondUser] = users;
    await firstUser.friends.add(secondUser);
    const accessTokenModel = await firstUser.createAccessToken();
    accessToken = accessTokenModel.id;
  });

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  it('should return a properly sorted result from users', function(done) {
    request
      .get('/api/hallOfFame')
      .expect('Content-Type', /json/)
      .end((err, res) => {
        const result = res.body;

        expect(res.statusCode).to.be.equal(200);
        expect(result).to.have.lengthOf(5);

        const [firstResult, secondResult] = result;
        expect(firstResult.username).to.be.equal('test-user-3');
        expect(secondResult.username).to.be.equal('test-user-2');
        done();
      });
  });

  it('should return a personal result for a specific user', function(done) {
    request
      .post('/api/hallOfFame/friends')
      .set('Authorization', accessToken)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        const result = res.body;

        expect(res.statusCode).to.be.equal(200);
        expect(result).to.have.lengthOf(1);

        const [firstResult] = result;
        expect(firstResult.username).to.be.equal('test-user-2');
        done();
      })
  });
});
