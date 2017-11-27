'use strict';

const app = require('../server/server');
const expect = require('chai').expect;
const mute = require('mute');
const request = require('supertest')(app);

describe('Monetize', function() {
  let accessToken, MonetizeModel;
  let ownerUser, tapjoyKey;

  beforeEach(async function () {
    MonetizeModel = app.models.monetize;

    const UserModel = app.models.user;
    await UserModel.deleteAll();

    ownerUser = await UserModel.create({winis: 50});
    tapjoyKey = app.get('tapjoyKey');
  });

  after(async function () {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Tapjoy', function() {
    it('should award a certain amount of winis for completing a mission', function() {
      const params = {
        "id": "123",
        "snuid": ownerUser.id,
        "currency": 55,
        "mac_address": "00-16-41-34-2C-A6"
      };

      const verifier = 

      request
        .get(`/api/deposit/tapjoy`)
        .query(params)
    });
  });
});
