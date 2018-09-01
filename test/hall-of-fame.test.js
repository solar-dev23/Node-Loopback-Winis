const { expect } = require('chai');
const app = require('../server/server');
const request = require('supertest')(app);

describe('Hall Of Fame', () => {
  let accessToken;
  let callingUser;

  before(async () => {
    const UserModel = app.models.user;
    await UserModel.deleteAll();

    const users = await UserModel.create([
      {
        username: 'test-user-1',
        winis: 25,
        diamonds: 5,
      },
      {
        username: 'test-user-2',
        winis: 50,
        diamonds: 10,
      },
      {
        username: 'test-user-3',
        winis: 650,
        diamonds: 6,
      },
      {
        username: 'test-user-4',
        winis: 5,
      },
      {
        username: 'test-user-5',
        winis: 0,
      },
    ]);

    const [firstUser, secondUser] = users;
    await firstUser.friends.add(secondUser);
    const accessTokenModel = await firstUser.createAccessToken();
    callingUser = firstUser;
    accessToken = accessTokenModel.id;
  });

  after(async () => {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Sort by Winis', () => {
    it('should return a properly sorted by winis result from users', (done) => {
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

    it('should include the calling user in the list of friends', (done) => {
      request
        .post('/api/hallOfFame/friends')
        .set('Authorization', accessToken)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          const result = res.body;

          expect(res.statusCode).to.be.equal(200);
          expect(result.map(user => user.id)).to.include(callingUser.id);
          done();
        });
    });

    it('should return a friends result for a specific user', (done) => {
      request
        .post('/api/hallOfFame/friends')
        .set('Authorization', accessToken)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          const result = res.body;

          expect(res.statusCode).to.be.equal(200);
          expect(result).to.have.lengthOf(2);

          const [firstResult] = result;
          expect(firstResult.username).to.be.equal('test-user-2');
          done();
        });
    });
  });

  describe('Sort by Diamonds', () => {
    it('should return the users diamond count even when sorted by winis', (done) => {
      request
        .get('/api/hallOffame')
        .expect('Content-Type', /json/)
        .end((err, res) => {
          const result = res.body;

          expect(res.statusCode).to.be.equal(200);
          expect(result).to.have.lengthOf(5);

          const [firstResult, secondResult] = result;
          expect(firstResult.diamonds).to.be.equal(6);
          expect(secondResult.diamonds).to.be.equal(10);
          done();
        });
    });

    it('should return the users sorted by diamonds', (done) => {
      request
        .get('/api/hallOffame?sort=diamonds')
        .expect('Content-Type', /json/)
        .end((err, res) => {
          const result = res.body;

          expect(res.statusCode).to.be.equal(200);
          expect(result).to.have.lengthOf(5);

          const [firstResult, secondResult] = result;
          expect(firstResult.username).to.be.equal('test-user-2');
          expect(secondResult.username).to.be.equal('test-user-3');
          done();
        });
    });
  });
});
