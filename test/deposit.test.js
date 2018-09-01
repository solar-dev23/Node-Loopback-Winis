/* eslint-disable camelcase */
const { expect } = require('chai');
const mute = require('mute');
const md5 = require('md5');
const app = require('../server/server');
const request = require('supertest')(app);

describe('Deposit', () => {
  let accessToken,
    DepositModel;
  let ownerUser;

  beforeEach(async () => {
    DepositModel = app.models.deposit;
    const UserModel = app.models.user;
    await UserModel.deleteAll();

    ownerUser = await UserModel.create({
      winis: 0,
      spins: 0,
      diamonds: 0,
      scratchs: 0,
    });
    accessToken = await ownerUser.createAccessToken();
  });

  after(async () => {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Tapjoy', () => {
    const grantedWinis = 25;
    const displayMultiplier = 1.0;
    const randomExternalId = 456;
    const tapjoyKey = app.get('tapjoyKey');

    it('should award a certain amount of winis for completing a mission', (done) => {
      const params = {
        id: randomExternalId,
        snuid: ownerUser.id,
        currency: grantedWinis,
        mac_address: '00-16-41-34-2C-A6',
        display_multiplier: displayMultiplier,
        verifier: md5(`${randomExternalId}:${ownerUser.id}:${grantedWinis}:${tapjoyKey}`),
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

    it('should return 403 status code because of invalid userId', (done) => {
      const params = {
        id: randomExternalId,
        snuid: `${ownerUser.id}${1}`,
        currency: grantedWinis,
        mac_address: '00-16-41-34-2C-A6',
        display_multiplier: displayMultiplier,
        verifier: md5(`${randomExternalId}:${`${ownerUser.id}${1}`}:${grantedWinis}:${tapjoyKey}`),
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

    it('should return 403 status code because of absent param \'verifier\'', (done) => {
      const params = {
        snuid: ownerUser.id,
        currency: grantedWinis,
        mac_address: '00-16-41-34-2C-A6',
        display_multiplier: displayMultiplier,
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

    it('should return 403 status code because of wrong param \'verifier\'', (done) => {
      const params = {
        id: randomExternalId,
        snuid: ownerUser.id,
        currency: grantedWinis,
        mac_address: '00-16-41-34-2C-A6',
        display_multiplier: displayMultiplier,
        verifier: 'wrong',
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

  describe('appStore', () => {
    app.models.Deposit.getAppStoreRewardConfiguration = async function () {
      return [
        { productId: '2_winis', iconId: 'winis', amount: 2 },
        { productId: '5_scratches', iconId: 'scratch', amount: 5 },
        { productId: '7_diamonds', iconId: 'diamond', amount: 7 },
        { productId: '3_presents', iconId: 'present', amount: 3 },
        { productId: '12_spins', iconId: 'spin', amount: 12 },
      ];
    };

    it('should return rewardConfiguration', (done) => {
      request
        .get('/api/deposits/appStore/rewardsConfig')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.body[0].productId).to.be.equal('2_winis');
          expect(res.body[0].iconId).to.be.equal('winis');
          expect(res.body[0].amount).to.be.equal(2);
          done();
        });
    });

    it('should award 2 winis', (done) => {
      const params = {
        method: 'appstore',
        externalId: '2_winis',
      };

      request
        .post('/api/deposits/appStore')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send(params)
        .then((res) => {
          expect(res.body.success).to.be.equals(true);
          expect(res.body.method).to.be.equals('appstore');
          expect(res.body.user.winis).to.be.equal(2);
          expect(res.body.user.diamonds).to.be.equal(0);
          expect(res.body.user.spins).to.be.equal(0);
          expect(res.body.user.scratches).to.be.equal(0);
          done();
        });
    });

    it('should award 5 scratches', (done) => {
      const params = {
        externalId: '5_scratches',
      };

      request
        .post('/api/deposits/appStore')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send(params)
        .then((res) => {
          expect(res.body.success).to.be.equals(true);
          expect(res.body.method).to.be.equals('appstore');
          expect(res.body.user.winis).to.be.equal(0);
          expect(res.body.user.diamonds).to.be.equal(0);
          expect(res.body.user.spins).to.be.equal(0);
          expect(res.body.user.scratches).to.be.equal(5);
          done();
        });
    });

    it('should award 7 diamonds', (done) => {
      const params = {
        method: 'appstore',
        externalId: '7_diamonds',
      };

      request
        .post('/api/deposits/appStore')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send(params)
        .then((res) => {
          expect(res.body.success).to.be.equals(true);
          expect(res.body.method).to.be.equals('appstore');
          expect(res.body.user.winis).to.be.equal(0);
          expect(res.body.user.diamonds).to.be.equal(7);
          expect(res.body.user.spins).to.be.equal(0);
          expect(res.body.user.scratches).to.be.equal(0);
          done();
        });
    });

    it('should award 3 presents', (done) => {
      const params = {
        method: 'appstore',
        externalId: '3_presents',
      };

      request
        .post('/api/deposits/appStore')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send(params)
        .then((res) => {
          expect(res.body.success).to.be.equals(true);
          expect(res.body.method).to.be.equals('appstore');
          expect(res.body.user.winis).to.be.equal(30);
          expect(res.body.user.diamonds).to.be.equal(3);
          expect(res.body.user.spins).to.be.equal(3);
          expect(res.body.user.scratches).to.be.equal(3);
          done();
        });
    });

    it('should award 12 spins', (done) => {
      const params = {
        method: 'appstore',
        externalId: '12_spins',
      };

      request
        .post('/api/deposits/appStore')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send(params)
        .then((res) => {
          expect(res.body.success).to.be.equals(true);
          expect(res.body.method).to.be.equals('appstore');
          expect(res.body.user.winis).to.be.equal(0);
          expect(res.body.user.diamonds).to.be.equal(0);
          expect(res.body.user.spins).to.be.equal(12);
          expect(res.body.user.scratches).to.be.equal(0);
          done();
        });
    });

    it('should fail award wrong externalId', (done) => {
      const unmute = mute();
      const params = {
        method: 'appstore',
        externalId: '3_winis',
      };

      request
        .post('/api/deposits/appStore')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send(params)
        .then((res) => {
          expect(res.statusCode).to.be.equals(422);
          unmute();
          done();
        });
    });
  });
});
