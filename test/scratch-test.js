'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);
const jimp = require('jimp');

describe('Scratch', function() {
  let accessToken, UserModel;
  let ownerUser, friendUser, strangerUser;

  beforeEach(async function() {
    UserModel = app.models.user;
    await UserModel.deleteAll();
    [ownerUser, friendUser, strangerUser] = await UserModel.create([
      {
        winis: 50,
        scratches: 1,
      },
    ]);
    await ownerUser.friends.add(friendUser);
    accessToken = await ownerUser.createAccessToken();
  });

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  it('should get scratch', function(done) {
    request
        .post('/api/scratches/generate')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.success).to.be.equal(true);
          expect(res.body.board.length).to.be.equal(6);
          done();
        });
  });

  it('should refuse to get scratch because there are no scratches left', function(done) {
    const unmute = mute();
    request
      .post('/api/scratches/generate')
      .set('Authorization', accessToken.id)
      .expect('Content-Type', /json/)
      .send()
      .then(res => {
        expect(res.statusCode).to.be.equal(200);
        return request
          .post(`/api/scratches/${res.body.id}/reveal`)
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send();
      })
      .then((res)=>{
        expect(res.statusCode).to.be.equal(200);
        return request
          .post('/api/scratches/generate')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send();
      })
      .then(res =>{
        expect(res.statusCode).to.be.equal(409);
        unmute();
        done();
      });
  });
});
