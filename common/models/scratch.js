'use strict';

const Ivoire = require('ivoire-weighted-choice');
const PrizeManager = require('../services/prize');

const spinOptions = [
  'diamond', 'winis', 'scratch', 'present', 'spin',
];

const spinWeights = [
  15, 50, 15, 5, 15,
];
module.exports = function(Scratch) {
  Scratch.calculateScratch = () => {
    const ivoire = new Ivoire();
    return ivoire.weighted_choice(spinOptions, spinWeights);
  };
  
  Scratch.scratch = async function(options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Scratch.app.models.user;

    const user = await UserModel.findById(userId);
    if (user.scratches === 0) {
      const error = new Error('User has no more scratches');
      error.status = 409;
      throw error;
    }

    const scratchResult = Scratch.calculateScratch();

    const scratch = await Scratch.create({
      spinResult: scratchResult,
      userId: user.id,
    });
    let userAttributes;
    try {
      userAttributes = PrizeManager.handlePrize(user, scratchResult);
    } catch (err) {
        
    }
    if (typeof userAttributes['scratches'] === 'undefined')
      userAttributes['scratches'] = user.scratches;
    userAttributes['scratches']--;
    const updatedUser = await user.updateAttributes(userAttributes);

    return {};
  };
};
