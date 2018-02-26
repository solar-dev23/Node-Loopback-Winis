'use strict';

module.exports = function(Battle) {
  Battle.challenge = async function(opponentId, stake, gameType, options) {
    const token = options && options.accessToken;
    const challengerId = token && token.userId;

    if (!challengerId) {
      const error = new Error('Wrong userToken');
      error.status = 409;
      throw error;
    }
    const UserModel = Battle.app.models.user;
    const challenger = await UserModel.findById(challengerId);
    if (!challenger) {
      const error = new Error('challenger not found');
      error.status = 404;
      throw error;
    }
    
    const opponent = await UserModel.findById(opponentId);
    if (!opponent) {
      const error = new Error('Opponent not found');
      error.status = 404;
      throw error;
    }
    
    let existingBattle = await Battle.findOne({where: {challengerId: challengerId, opponentId: opponentId, result: 'unset'}});
    if (!existingBattle) { 
      existingBattle = await Battle.findOne({where: {challengerId: opponentId, opponentId: challengerId, result: 'unset'}});
    }
    
    if (existingBattle) {
      const error = new Error('You have already started battle with this user');
      error.status = 409;
      throw error;
    }

    if (challenger.id == opponent.id) {
      const error = new Error('You cannot start battle with yourself');
      error.status = 409;
      throw error;
    }

    try {
      await challenger.stakeFunds(stake);
    } catch (error) {
      challenger.releaseFunds(stake);
      throw error;
    }
    try {
      await opponent.stakeFunds(stake);
    } catch (error) {
      challenger.releaseFunds(stake);
      opponent.releaseFunds(stake);
      throw error;
    }

    let newBattle = await Battle.create({
      challengerId: challenger.id,
      opponentId: opponent.id,
      game: gameType,
      stake: stake,
    });
    
    return newBattle;
  };

  Battle.prototype.acceptBattle = async function(options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const opponentId = token && token.userId;

    if (currentBattle.opponentId != opponentId) {
      const error = new Error('You cannot accept someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status != 'pending') {
      const error = new Error('Battle is already accepted or rejected');
      error.status = 409;
      throw error;
    }

    const updatedBattle = await currentBattle.updateAttribute('status', 'accepted');

    return updatedBattle;
  };

  Battle.prototype.rejectBattle = async function(options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const opponentId = token && token.userId;

    if (currentBattle.opponentId != opponentId) {
      const error = new Error('You cannot reject someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status != 'pending') {
      const error = new Error('Battle is already accepted or rejected');
      error.status = 409;
      throw error;
    }

    const UserModel = Battle.app.models.user;
    const challenger = await UserModel.findById(currentBattle.challengerId);
    const opponent = await UserModel.findById(currentBattle.opponentId);

    const updatedBattle = await currentBattle.updateAttribute('status', 'rejected');

    const updatedChallenger = await challenger.releaseFunds(currentBattle.stake);
    const updatedOpponent = await opponent.releaseFunds(currentBattle.stake);

    return updatedBattle;
  };

  Battle.prototype.won = async function(options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const callerId = token && token.userId;
    if (!(currentBattle.challengerId == callerId || currentBattle.opponentId == callerId)) {
      const error = new Error('You cannot end someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status != 'accepted') {
      const error = new Error('You cannot win unaccepted game');
      error.status = 409;
      throw error;
    }
    
    if (callerId == currentBattle.challengerId) {
      if (currentBattle.challengerStatus != 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      };
    } else {
      if (currentBattle.opponentStatus != 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      };
    }
    
    let updatedBattle;
    if (currentBattle.challengerId == callerId) {
      updatedBattle = await currentBattle.updateAttribute('challengerStatus', 'won');
    } else {
      updatedBattle = await currentBattle.updateAttribute('opponentStatus', 'won');
    }

    return updatedBattle;
  };

  Battle.prototype.lost = async function(options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const callerId = token && token.userId;
    if (!(currentBattle.challengerId == callerId || currentBattle.opponentId == callerId)) {
      const error = new Error('You cannot end someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status != 'accepted') {
      const error = new Error('You cannot lose unaccepted game');
      error.status = 409;
      throw error;
    }

    if (callerId == currentBattle.challengerId) {
      if (currentBattle.challengerStatus != 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      };
    } else {
      if (currentBattle.opponentStatus != 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      };
    }

    let updatedBattle;
    if (currentBattle.challengerId == callerId) {
      updatedBattle = await currentBattle.updateAttribute('challengerStatus', 'lost');
    } else {
      updatedBattle = await currentBattle.updateAttribute('opponentStatus', 'lost');
    }

    return updatedBattle;
  };

  Battle.prototype.draw = async function(options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const callerId = token && token.userId;
    if (!(currentBattle.challengerId == callerId || currentBattle.opponentId == callerId)) {
      const error = new Error('You cannot end someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status != 'accepted') {
      const error = new Error('You cannot draw unaccepted game');
      error.status = 409;
      throw error;
    }
    
    if (callerId == currentBattle.challengerId) {
      if (currentBattle.challengerStatus != 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      };
    } else {
      if (currentBattle.opponentStatus != 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      };
    }

    let updatedBattle;
    if (currentBattle.challengerId == callerId) {
      updatedBattle = await currentBattle.updateAttribute('challengerStatus', 'draw');
    } else {
      updatedBattle = await currentBattle.updateAttribute('opponentStatus', 'draw');
    }

    return updatedBattle;
  };

  Battle.observe('before save', async function(ctx) {
    if (ctx.currentInstance) {
      let bothUpdated = false;
      if (ctx.data.challengerStatus) {
        if (ctx.currentInstance.opponentStatus != 'unset') {
          bothUpdated = true;
        }
      }
      if (ctx.data.opponentStatus) {
        if (ctx.currentInstance.challengerStatus != 'unset') {
          bothUpdated = true;
        }
      }
      if (bothUpdated) {
        if (ctx.currentInstance.status == 'accepted') {
          let UserModel = Battle.app.models.user;
          ctx.data.status = 'finished';
          if (ctx.data.challengerStatus == 'won' && ctx.currentInstance.opponentStatus == 'lost') {
            let winner =  await UserModel.findById(ctx.currentInstance.challengerId);
            let losser =  await UserModel.findById(ctx.currentInstance.opponentId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'challenger won';
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
          } else if (ctx.currentInstance.challengerStatus == 'won' && ctx.data.opponentStatus == 'lost') {
            let winner =  await UserModel.findById(ctx.currentInstance.challengerId);
            let losser =  await UserModel.findById(ctx.currentInstance.opponentId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'challenger won';
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
          } else if (ctx.data.challengerStatus == 'lost' && ctx.currentInstance.opponentStatus == 'won') {
            let winner =  await UserModel.findById(ctx.currentInstance.opponentId);
            let losser =  await UserModel.findById(ctx.currentInstance.challengerId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'opponent won';
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
          }  else if (ctx.currentInstance.challengerStatus == 'lost' && ctx.data.opponentStatus == 'won') {
            let winner =  await UserModel.findById(ctx.currentInstance.opponentId);
            let losser =  await UserModel.findById(ctx.currentInstance.challengerId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'opponent won';
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
          } else if (ctx.data.challengerStatus == 'draw' && ctx.currentInstance.opponentStatus == 'draw') {
            let drawwer1 =  await UserModel.findById(ctx.currentInstance.opponentId);
            let drawwer2 =  await UserModel.findById(ctx.currentInstance.challengerId);
            await drawwer1.releaseFunds(ctx.currentInstance.stake);
            await drawwer2.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'both draw';
          } else if (ctx.currentInstance.challengerStatus == 'draw' && ctx.data.opponentStatus == 'draw') {
            let drawwer1 =  await UserModel.findById(ctx.currentInstance.opponentId);
            let drawwer2 =  await UserModel.findById(ctx.currentInstance.challengerId);
            await drawwer1.releaseFunds(ctx.currentInstance.stake);
            await drawwer2.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'both draw';
          } else {
            let drawwer1 =  await UserModel.findById(ctx.currentInstance.opponentId);
            let drawwer2 =  await UserModel.findById(ctx.currentInstance.challengerId);
            await drawwer1.releaseFunds(ctx.currentInstance.stake);
            await drawwer2.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'error state';
          }
        }
      }
    }
  });
};
