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
      });
    }

    return {result: true};
  };

  Deposit.appStore = async function(externalId, options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Deposit.app.models.user;

    const rewardConfiguration = await Deposit.getRewardConfiguration();
    if (rewardConfiguration.map(value => value.productId).indexOf(externalId) < 0) {
      const error = new Error('Wrong externalId');
      error.status = 422;
      throw error;
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User id is not valid');
      error.status = 409;
      throw error;
    }
    const currentReward = rewardConfiguration.filter(element => element.productId == externalId)[0];
    const amount = currentReward.amount;
    switch (currentReward.iconId) {
      case 'empty': break;
      case 'diamond':  await user.updateAttribute('diamonds', user.diamonds + amount); break;
      case 'winis':  await user.updateAttribute('winis', user.winis + amount); break;
      case 'scratch':  await user.updateAttribute('scratches', user.scratches + amount); break;
      case 'present':  await Promise.all([
        user.updateAttribute('diamonds', user.diamonds + amount), 
        user.updateAttribute('winis', user.winis + amount * 10),
        user.updateAttribute('scratches', user.scratches + amount),
        user.updateAttribute('spins', user.spins + amount),
      ]); break;
      case 'spin':  await user.updateAttribute('spins', user.spins + amount); break;
    }
    const newDeposit = await Deposit.create({
      externalId: externalId,
      userId: userId,
      method: 'appstore',
      amount: amount,
    });

    let result = newDeposit;
    result.success = true;
    result.user = user;

    return result;
  };

  Deposit.getRewardConfiguration = async function() {
    return [
      {productId: '1_scratch_2', iconId: 'scratch', amount: 1},
      {productId: '2_winis', iconId: 'winis', amount: 2},
      {productId: '10_winis', iconId: 'winis', amount: 10},
      {productId: '20_winis', iconId: 'winis', amount: 20},
    ];
  };
};
