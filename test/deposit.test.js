'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);
const md5 = require('md5');

describe('Deposit', function() {
  let accessToken, DepositModel;
  let ownerUser, tapjoyKey;

  beforeEach(async function() {
    DepositModel = app.models.deposit;
    DepositModel.getRewardConfiguration = function() {
      return [
        {productId: '2_winis', iconId: 'winis', amount: 2},
      ];
    };
    const UserModel = app.models.user;
    await UserModel.deleteAll();

    ownerUser = await UserModel.create({
      winis: 0, 
      spins: 0, 
      diamonds: 0, 
      scratchs: 0,
    });
    tapjoyKey = app.get('tapjoyKey');
    accessToken = await ownerUser.createAccessToken();
  });

  after(async function() {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Tapjoy', function() {
    let grantedWinis = 25;
    let displayMultiplier = 1.0;
    let randomExternalId = 456;
    it('should award a certain amount of winis for completing a mission', function(done) {
      const params = {
        'id': randomExternalId,
        'snuid': ownerUser.id,
        'currency': grantedWinis,
        'mac_address': '00-16-41-34-2C-A6',
        'display_multiplier': displayMultiplier,
        'verifier': md5(`${randomExternalId}:${ownerUser.id}:${grantedWinis}:${tapjoyKey}`),
      };

      request
        .get('/api/deposits/tapjoy')
        .query(params)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.result).to.be.equal(true);
          done();
        });
    });

    it('should return 403 status code because of invalid userId', function(done) {
      const params = {
        'id': randomExternalId,
        'snuid': ownerUser.id + '' + 1,
        'currency': grantedWinis,
        'mac_address': '00-16-41-34-2C-A6',
        'display_multiplier': displayMultiplier,
        'verifier': md5(`${randomExternalId}:${ownerUser.id + '' + 1}:${grantedWinis}:${tapjoyKey}`),
      };

      const unmute = mute();
      request
        .get('/api/deposits/tapjoy')
        .query(params)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(403);
          unmute();
          done();
        });
    });

    it('should return 403 status code because of absent param \'verifier\'', function(done) {
      const params = {
        'snuid': ownerUser.id,
        'currency': grantedWinis,
        'mac_address': '00-16-41-34-2C-A6',
        'display_multiplier': displayMultiplier,
      };

      const unmute = mute();
      request
        .get('/api/deposits/tapjoy')
        .query(params)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(403);
          unmute();
          done();
        });
    });

    it('should return 403 status code because of wrong param \'verifier\'', function(done) {
      const params = {
        'id': randomExternalId,
        'snuid': ownerUser.id,
        'currency': grantedWinis,
        'mac_address': '00-16-41-34-2C-A6',
        'display_multiplier': displayMultiplier,
        'verifier': 'wrong',
      };

      const unmute = mute();
      request
        .get('/api/deposits/tapjoy')
        .query(params)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          expect(res.statusCode).to.be.equal(403);
          unmute();
          done();
        });
    });
  });

  describe('appStore', function() {
    it('should award 2 winis', function(done) {
      const params = {    
        'userId': accessToken.userId,     
        'method': 'appstore',
        'externalId': '2_winis',
      };

      request
      .post('/api/deposits/')
      .set('Authorization', accessToken.id)
      .expect('Content-Type', /json/)
      .send(params)
      .then((res)=>{
        expect(res.body.success).to.be.equals(true);
        expect(res.body.user.winis).to.be.equal(2);
        expect(res.body.user.diamonds).to.be.equal(0);
        expect(res.body.user.spins).to.be.equal(0);
        expect(res.body.user.scratches).to.be.equal(0);
        done();
      });
    });

    it('should fail award wrong externalId', function(done) {
      const unmute = mute();
      const params = {    
        'userId': accessToken.userId,     
        'method': 'appstore',
        'externalId': '3_winis',
      };
      request
      .post('/api/deposits/')
      .set('Authorization', accessToken.id)
      .expect('Content-Type', /json/)
      .send(params)
      .then((res)=>{
        expect(res.statusCode).to.be.equals(422);
        unmute();
        done();
      });
    });
  });
});
