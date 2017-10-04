'use strict';
const Ivoire = require('ivoire-weighted-choice');

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

    user.handlePrize(spinResult);
    user.spins--;

    await user.save(user);

    return {
      spinResult: spinResult,
      spin: spin,
      user: user,
    };
  };
};
