'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const request = require('supertest')(app);

describe('Hall Of Fame', function() {
  let accessToken;

  before(async () => {
    const UserModel = app.models.user;
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

  it('should return a properly sorted result from users', function(done) {
    request
      .get('/api/hallOfFame')
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        expect(res.body).to.have.lengthOf(5);
        done();
      });
  });

  it('should return a personal result for a specific user', function(done) {
    request
      .post('/api/hallOfFame/friends')
      .set('Authorization', accessToken)
      .expect(200)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        expect(res.body).to.have.lengthOf(1);
        done();
      })
  });
});
