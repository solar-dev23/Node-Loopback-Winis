'use strict';

let md5 = require('md5');

module.exports = function(Deposit) {
  Deposit.tapjoy = async function(id, snuid, currency, macAddress, displayMultiplier, verifier) {
    const app = Deposit.app;
    let secretKey = app.get('tapjoyKey');

    if (!verifier) {
            // [snuid, currency, macAddress, displayMultiplier]
      let error = new Error('Parameter secretKey not present. You are probably not a TapJoy server.');
      error.status = 403;
      throw error;
    }
        // [snuid, currency, macAddress, displayMultiplier] + [id, verifier]˝
    if (md5(`${id}:${snuid}:${currency}:${secretKey}`) != verifier) {
      let error = new Error('Request not verified. You are probably not a TapJoy server.');
      error.status = 403;
      throw error;
    }
    const user = await app.models.user.findById(snuid);

    if (!user) {
      let error = new Error('User does not exist.');
      error.status = 403;
      throw error;
    }

    let oldWinis = user.winis;

    try {
      let newWinis = (await user.grantWinis(parseInt(currency * displayMultiplier))).winis;
      if (newWinis == (oldWinis + parseInt(currency * displayMultiplier))) {

      }
    } catch (catchError) {
      let error = new Error('Error while granting winis.');
      error.status = 403;
      throw error;
    } finally {
      let newDeposit = await Deposit.create({
        externalId: id,
        userId: snuid,
        method: 'tapjoy',
        amount: currency,
      });
    }

    return {result: true};
  };
};
