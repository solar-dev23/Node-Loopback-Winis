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
        price: currency / 1000,
      });
    }

    return {result: true};
  };

  Deposit.beforeRemote('create', async function(context, modelInstance, next) {
    const UserModel = Deposit.app.models.user;

    const winisAmount = Number.parseInt(context.req.body.price * 1000);
    const user = await UserModel.findById(context.req.body.userId);
    if (!user) {
      const error = new Error('User id not valid');
      error.status = 409;
      throw error;
    }
    await user.updateAttribute('winis', user.winis + winisAmount);
  });

  Deposit.afterRemote('create', async function(ctx, next) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    const UserModel = Deposit.app.models.user;

    const user = await UserModel.findById(userId);
    ctx.result.success = true;
    ctx.result.user = user;
  });
};
