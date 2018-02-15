'use strict';
const LoopBackContext = require('loopback-context');

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
      const error = new Error('You cannot win unaccepted game');
      error.status = 409;
      throw error;
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
      const error = new Error('You cannot win unaccepted game');
      error.status = 409;
      throw error;
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
          if (ctx.data.challengerStatus == 'won' && ctx.currentInstance.opponentStatus == 'lost') {
            ctx.data.status = 'finished';
            ctx.data.result = 'challenger won';
            let winner =  await UserModel.findById(ctx.currentInstance.challengerId);
            let losser =  await UserModel.findById(ctx.currentInstance.opponentId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
          } else if (ctx.data.challengerStatus == 'lost' && ctx.currentInstance.opponentStatus == 'won') {
            ctx.data.status = 'finished';
            ctx.data.result = 'opponent won';
            let winner = await UserModel.findById(ctx.currentInstance.opponentId);
            let losser = await UserModel.findById(ctx.currentInstance.challengerId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
          } else if (ctx.data.challengerStatus == 'draw' && ctx.currentInstance.opponentStatus == 'draw') {
            ctx.data.status = 'finished';
            ctx.data.result = 'both draw';
            let winner = await UserModel.findById(ctx.currentInstance.challengerId);
            let losser = await UserModel.findById(ctx.currentInstance.opponentId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
          } else {
            ctx.data.status = 'finished';
            ctx.data.result = 'error state';
            let winner = await UserModel.findById(ctx.currentInstance.challengerId);
            let losser = await UserModel.findById(ctx.currentInstance.opponentId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
          }
        }
      }
    }
  });
};
