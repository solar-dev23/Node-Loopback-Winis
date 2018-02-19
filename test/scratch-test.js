'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);
const jimp = require('jimp');

describe('User', function() {
  let accessToken, UserModel;
  let ownerUser, friendUser, strangerUser;

  beforeEach(async function() {
    UserModel = app.models.user;
    await UserModel.deleteAll();
    [ownerUser, friendUser, strangerUser] = await UserModel.create([
      {
        winis: 50,
        scratches: 2,
      },
    ]);
    await ownerUser.friends.add(friendUser);
    accessToken = await ownerUser.createAccessToken();
  });

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Owner', function() {
    it('should refuse to get scratch because no scratches left', function(done) {
      const unmute = mute();
      request
        .post('/api/scratches/')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(401);
          expect(res.body.error.code).to.be.equal('AUTHORIZATION_REQUIRED');
          expect(res.body.error).to.not.be.a('null');
          unmute();
          done();
        });
    });
  });
});
