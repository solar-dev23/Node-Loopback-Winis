'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);

describe('User', function() {
  let accessToken, UserModel;
  let ownerUser, friendUser, strangerUser;

  beforeEach(async function() {
    UserModel = app.models.user;
    await UserModel.deleteAll();
    [ownerUser, friendUser, strangerUser] = await UserModel.create([
      {
        winis: 50
      }, {}, {
        winis: 50,
        phoneNumber: '+123456789'
      }
    ]);
    await ownerUser.friends.add(friendUser);
    accessToken = await ownerUser.createAccessToken();
  });

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Owner', function() {
    it('should allow to get users own info', function(done) {
      request
        .get(`/api/users/${ownerUser.id}`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.id).to.be.equal(ownerUser.id);
          done();
        });
    });

    it('should generate a random name to a new user', function() {
      expect(ownerUser.username).to.match(/^\w+-\w+-\d{2}/);
    });

    it('should refuse to get info on some other user', function(done) {
      const unmute = mute();
      request
        .get(`/api/users/${strangerUser.id}`)
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

  describe('Friends', function() {
    it('should add another user to friends', function(done) {
      request
        .put(`/api/users/${ownerUser.id}/friends/rel/${strangerUser.id}`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          UserModel.findById(ownerUser.id)
            .then((user) => {
              expect(res.statusCode).to.be.equal(200);
              expect(res.body.id).to.be.equal(strangerUser.id);
              expect(user.friendIds).to.include(strangerUser.id);
              done();
            })
        });
    });

    it('should return users in the database by phone', function(done) {
      request
        .post('/api/users/findByPhones')
        .send(['+123456789'])
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body).to.have.lengthOf(1);
          expect(res.body[0].id).to.be.equal(strangerUser.id);
          done();
        });
    });

    it('should allow to get info for a friend of the user', function(done) {
      request
        .get(`/api/users/${ownerUser.id}/friends/${friendUser.id}`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.id).to.be.equal(friendUser.id);
          done();
        });
    });

    it('should refuse to get info for a random user', function(done) {
      const unmute = mute();
      request
        .get(`/api/users/${ownerUser.id}/friends/${strangerUser.id}`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(400);
          expect(res.body.error).to.not.be.a('null');
          done();
        });
    });
  });

  describe('SendWinis', function() {
    it('should send winis from one user to another', function(done) {
      request
        .post(`/api/users/${strangerUser.id}/sendWinis/25`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('success');
          expect(res.body.sender.winis).to.be.equal(25);
          expect(res.body.recipient.winis).to.be.equal(75);
          done();
        });
    });

    it('should refuse to send if not enough funds', function(done) {
      const unmute = mute();
      request
        .post(`/api/users/${strangerUser.id}/sendWinis/100`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(409);
          expect(res.body.error).to.not.be.a('null');
          mute();
          done();
        });
    });
  })
});
