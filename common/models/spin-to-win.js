'use strict';

const Ivoire = require('ivoire-weighted-choice');
const debug = require('debug')('winis:spin-to-win');

const spinOptions = [
  'diamond', 'present', 'double_spin', '5_winis', 'double_diamond',
  'empty', '2_winis', 'double_scratch', 'scratch', 'spin',
];

const spinWeights = [
  7, 1, 5, 30, 3,
  1, 33, 5, 10, 5,
];

module.exports = function(SpinToWin) {
  SpinToWin.calculateSpin = () => {
    const ivoire = new Ivoire();
    return ivoire.weighted_choice(spinOptions, spinWeights);
  };

  SpinToWin.handlePrize = (user, prize) => {
    debug(`Handle prize ${prize}`);

    let attributes = {};

    switch(prize) {
      case 'diamond':
        attributes['diamonds'] = user.diamonds + 1;
        break;
      case 'present':
        debug('Need to handle present');
        break;
      case 'double_spin':
        attributes['spins'] = user.spins + 2;
        break;
      case '5_winis':
        attributes['winis'] = user.winis + 5;
        break;
      case 'double_diamond':
        attributes['diamonds'] = user.diamonds + 2;
        break;
      case '2_winis':
        attributes['winis'] = user.winis + 2;
        break;
      case 'double_scratch':
        attributes['scratches'] = user.scratches + 2;
        break;
      case 'scratch':
        attributes['scratches'] = user.scratches + 1;
        break;
      case 'spin':
        attributes['spins'] = user.spins + 1;
        break;
      default:
        break;
    }

    return attributes;
  };

  SpinToWin.spin = async (options) => {
    const spinResult = SpinToWin.calculateSpin();
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = SpinToWin.app.models.user;

    const user = await UserModel.findById(userId);
    if (user.spins === 0) {
      throw new Error('User has no spins');
    }

    const spin = await SpinToWin.create({
      spinResult: spinResult,
      userId: user.id,
    });

    let userAttributes = SpinToWin.handlePrize(user, spinResult);
    if (typeof userAttributes['spins'] === 'undefined')
      userAttributes['spins'] = user.spins;
    userAttributes['spins']--;
    const updatedUser = await user.updateAttributes(userAttributes);

    return {
      spinResult: spinResult,
      spin: spin,
      user: updatedUser,
    };
  };
};
