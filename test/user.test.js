'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);
const jimp = require('jimp');

describe('User', function() {
  let accessToken, UserModel, ownerUser, friendUser, strangerUser, blockedUser;

  beforeEach(async function() {
    UserModel = app.models.user;
    await UserModel.deleteAll();
    [ownerUser, friendUser, strangerUser, blockedUser] = await UserModel.create([
      {
        winis: 50,
        staked: 15,
      }, {}, {
        username: 'username-Test',
        winis: 50,
        phoneNumber: '+123456789',
      }, {},
    ]);

    await ownerUser.friends.add(friendUser);
    await ownerUser.blocked.add(blockedUser);
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
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.id).to.be.equal(ownerUser.id);
          done();
        });
    });

    it('should generate a random name to a new user', function() {
      expect(ownerUser.username).to.match(/^\w+-\w+-\d{2}/);
    });

    it('have a default value for users avatar', function() {
      expect(ownerUser.avatar).to.equal('default');
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
        .then((res) => {
          UserModel.findById(ownerUser.id)
            .then((user) => {
              expect(res.statusCode).to.be.equal(200);
              expect(res.body.id).to.be.equal(strangerUser.id);
              expect(user.friendIds).to.include(strangerUser.id);
              done();
            });
        });
    });

    it('should add us to the pending list for the new friend', function(done) {
      request
        .put(`/api/users/${ownerUser.id}/friends/rel/${strangerUser.id}`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .then((res) => {
          UserModel.findById(strangerUser.id)
            .then((user) => {
              expect(res.statusCode).to.be.equal(200);
              expect(user.pendingIds).to.include(ownerUser.id);
              done();
            });
        });
    });

    it('should return users in the database by phone', function(done) {
      request
        .post('/api/users/findByPhones')
        .send(['+123456789'])
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .then((res) => {
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
        .then((res) => {
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
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.id).to.be.equal(strangerUser.id);
          done();
        });
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
        });
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
    });
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
          .then((res) => {
            const avatar = res.body.avatarData;
            expect(res.body.success).to.be.equal(true);
            expect(avatar.name).to.match(/^\w+_avatar\.jpg/);
            expect(avatar).includes({type: 'image/jpeg'});
            done();
          });
      });
    });

    describe('Default Avatar', function() {
      it('should return the default avatar in the default size', function(done) {
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

      it('should return default the avatar in a specific size', function(done) {
        request
          .get(`/api/users/${ownerUser.id}/avatar/400x400/avatar.jpg`)
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
          .get('/api/users/n0nex1st4nt/avatar.jpg')
          .end((err, res) => {
            expect(res.statusCode).to.be.equal(404);
            unmute();
            done();
          });
      });
    });

    describe('Uploaded Avatar', function() {
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
    });
  }).timeout(10000);

  describe('Blocked', function() {
    it('should add a user to blocked', function(done) {
      request
        .put(`/api/users/${ownerUser.id}/blocked/rel/${strangerUser.id}`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .then((res) => {
          UserModel.findById(ownerUser.id)
            .then((user) => {
              expect(res.statusCode).to.be.equal(200);
              expect(res.body.id).to.be.equal(strangerUser.id);
              expect(user.blockedIds).to.include(strangerUser.id);
              done();
            });
        });
    });

    it('should remove a blocked friend from friend list', function(done) {
      request
        .put(`/api/users/${ownerUser.id}/blocked/rel/${friendUser.id}`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .then((res) => {
          UserModel.findById(ownerUser.id)
            .then((user) => {
              expect(res.statusCode).to.be.equal(200);
              expect(user.friendIds).to.not.include(friendUser.id);
              done();
            });
        });
    });

    it('should remove a user from the blocked users', function (done) {
      request
        .delete(`/api/users/${ownerUser.id}/blocked/rel/${blockedUser.id}`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .then((res) => {
          UserModel.findById(ownerUser.id)
            .then((user) => {
              expect(res.statusCode).to.be.equal(204);
              expect(user.blockedIds).not.to.include(blockedUser.id);
              done();
            });
        });
    });

    it('should return the list of blocked users', function(done) {
      request
        .get(`/api/users/${ownerUser.id}/blocked`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body[0].id).to.be.equal(blockedUser.id);
          done();
        });
    });
  });

  describe('Devkit', function() {
    it('should mark a user as interested in the dev-kit', function(done) {
      request
        .patch(`/api/users/${ownerUser.id}`)
        .send({devkit: true})
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.devkit).to.be.equal(true);
          expect(res.body.winis).to.be.equal(50);
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
        .then((res) => {
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
          unmute();
          expect(res.statusCode).to.be.equal(409);
          expect(res.body.error).to.not.be.a('null');
          done();
        });
    });

    it('should refuse to send if funds are staked', function(done) {
      const unmute = mute();
      request
        .post(`/api/users/${strangerUser.id}/sendWinis/40`)
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

  describe('Staking', function() {
    it('should stake requested funds', async function() {
      await ownerUser.stakeFunds(20);
      expect(ownerUser.staked).to.equal(35);
    });

    it('should release requested funds', async function() {
      await ownerUser.releaseFunds(10);
      expect(ownerUser.staked).to.equal(5);
    });

    it('should transfer staked funds to another user', async function() {
      await ownerUser.transferStakedFunds(10, strangerUser);
    });

    it('should refuse to stake more than available', function(done) {
      ownerUser.stakeFunds(60)
        .catch((err) => {
          expect(err.status).to.be.equal(409);
          done();
        });
    });

    it('should refuse to release more than staked', function(done) {
      ownerUser.releaseFunds(60)
        .catch((err) => {
          expect(err.status).to.be.equal(409);
          done();
        });
    });

    it('should fail transfer more than staked funds', function(done) {
      ownerUser.transferStakedFunds(60, strangerUser)
        .catch((err) => {
          expect(err.status).to.be.equal(409);
          done();
        });
    });
  });
  describe('Daily spin', function() {
    it('should grant 0 spins', function(done) {
      let startSpins, lastDailySpinGrantingDate;
      request
      .get(`/api/users/${accessToken.userId}/`)
      .set('Authorization', accessToken.id)
      .expect('Content-Type', /json/)
      .send()
      .then((res) => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.body.id).to.be.equal(accessToken.userId);
        startSpins = res.body.spins;
        lastDailySpinGrantingDate = res.body.lastDailySpinGrantingDate;
        return request
        .post(`/api/users/${accessToken.userId}/freeSpins`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send();
      })
      .then(res =>{
        expect(res.statusCode).to.be.equal(200);
        expect(res.body.success).to.be.equal(false);
        return request
        .get(`/api/users/${accessToken.userId}/`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send();
      })
      .then(res =>{
        expect(res.statusCode).to.be.equal(200);
        expect(res.body.spins).to.be.equal(startSpins);
        expect(res.body.lastDailySpinGrantingDate).to.be.equal(lastDailySpinGrantingDate);
        done();
      });
    });

    it('should grant 1 spin for 1 day absence', function(done) {
      let startSpins;
      const testStartTimestamp = Date.now();
      UserModel.findById(accessToken.userId)
      .then(user=>{
        return user.updateAttribute('lastDailySpinGrantingDate', Date.now() - 24 * 60 * 60 * 1000 - 1);
      })
      .then(updatedUser =>{
        startSpins = updatedUser.spins;
        expect(new Date(updatedUser.lastDailySpinGrantingDate).getTime()).to.be.below(testStartTimestamp);
        return request
        .post(`/api/users/${accessToken.userId}/freeSpins`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send();
      })
      .then((res) => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.body.success).to.be.equal(true);
        return request
        .get(`/api/users/${accessToken.userId}/`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send();
      })
      .then(res =>{
        expect(res.statusCode).to.be.equal(200);
        expect(res.body.spins).to.be.equal(startSpins + 1);
        expect(new Date(res.body.lastDailySpinGrantingDate).getTime()).to.be.above(testStartTimestamp);
        done();
      });
    });

    it('should grant 1 spins for 3 day ansence', function(done) {
      let startSpins;
      const testStartTimestamp = Date.now();
      UserModel.findById(accessToken.userId)
      .then(user=>{
        return user.updateAttribute('lastDailySpinGrantingDate', Date.now() - 24 * 60 * 60 * 1000 * 3 - 1);
      })
      .then(updatedUser =>{
        startSpins = updatedUser.spins;
        expect(new Date(updatedUser.lastDailySpinGrantingDate).getTime()).to.be.below(testStartTimestamp);
        return request
        .post(`/api/users/${accessToken.userId}/freeSpins`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send();
      })
      .then((res) => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.body.success).to.be.equal(true);
        return request
        .get(`/api/users/${accessToken.userId}/`)
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send();
      })
      .then(res =>{
        expect(res.statusCode).to.be.equal(200);
        expect(res.body.spins).to.be.equal(startSpins + 1);
        expect(new Date(res.body.lastDailySpinGrantingDate).getTime()).to.be.above(testStartTimestamp);
        done();
      });
    });
  });
});
