'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);
const fs = require('fs');
const jimp = require('jimp');

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
        username: 'username-Test',
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
          unmute();
          done();
        });
    });

    it('should find a friend by username', function(done) {
      request
        .get('/api/users/findByUsername/username-test')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.id).to.be.equal(strangerUser.id);
          done();
        })
    });

    it('should not find a friend by partial username', function(done) {
      const unmute = mute();
      request
        .get('/api/users/findByUsername/test')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(404);
          expect(res.body.id).not.to.be.equal(strangerUser.id);
          unmute();
          done();
        })
    });

    it('should return a 404 for a non-existent user', function(done) {
      const unmute = mute();
      request
        .get('/api/users/findByUsername/no-idea')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(404);
          expect(res.body.error).to.not.be.a('null');
          unmute();
          done();
        });
    })
  });

  describe('Avatar', function() {
    describe('Upload', function() {
      beforeEach(function(done) {
        const storage = app.models.storage;
        storage.destroyContainer(app.get('container'), (err) => {
          if (err && err.code === 'ENOENT') err = null;
          done(err);
        });
      });

      it('should upload an avatar with post with a proper size', function(done) {
        const fileName = './test/test-images/avatar.jpg';

        request
          .post(`/api/users/${ownerUser.id}/avatar`)
          .set('Authorization', accessToken.id)
          .attach('avatar', fileName)
          .end((err, res) => {
            const avatar = res.body.avatarData;
            const user = res.body.user;

            expect(res.body.success).to.be.equal(true);
            expect(avatar.name).to.match(/^\w+_avatar\.jpg/);
            expect(avatar).includes({type: 'image/jpeg'});
            done();
          });
      });
    });

    describe('Download', function() {
      let avatarTimestamp;

      beforeEach(function(done) {
        const storage = app.models.storage;
        storage.destroyContainer(app.get('container'), (err) => {
          if (err && err.code !== 'ENOENT') return done(err);

          request
            .post(`/api/users/${ownerUser.id}/avatar`)
            .set('Authorization', accessToken.id)
            .attach('avatar', './test/test-images/avatar.jpg')
            .end((err, res) => {
              avatarTimestamp = res.body.user.avatar;
              done();
            });
        });
      });

      it('should return the avatar in the default size', function(done) {
        request
          .get(`/api/users/${ownerUser.id}/avatar.jpg`)
          .end((err, res) => {
            jimp.read(res.body)
              .then((avatar) => {
                expect(avatar.bitmap).to.includes({width: 250, height: 250});
                done();
              });
          });
      });

      it('should return the avatar in a specific size', function(done) {
        request
          .get(`/api/users/${ownerUser.id}/avatar/${avatarTimestamp}/400x400/avatar.jpg`)
          .end((err, res) => {
            jimp.read(res.body)
              .then((avatar) => {
                expect(avatar.bitmap).to.includes({width: 400, height: 400});
                done();
              });
          });
      });

      it('should return a proper error when requesting a non-existant user', function(done) {
        const unmute = mute();
        request
          .get(`/api/users/n0nex1st4nt/avatar.jpg`)
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(404);
            unmute();
            done();
          });
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
          unmute();
          done();
        });
    });
  });
});
