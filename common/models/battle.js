'use strict';

module.exports = function(Battle) {
  Battle.request = async function(opponent, stake) {
    if (ctx.instance && !ctx.isNewInstance) {
      const UserModel = Battle.app.models.user;

      const challengerId = ctx.instance.challengerId;
      const opponentId = ctx.instance.opponentId;
      const stake = ctx.instance.stake;

      const challenger = await UserModel.findById(challengerId);
      const opponent = await UserModel.findById(opponentId);

      await challenger.stakeFunds(stake);
      await opponent.stakeFunds(stake);
    }
  });
};
