'use strict';
const LoopBackContext = require('loopback-context');

module.exports = function(Battle) {
  Battle.challange = async function(opponentId, stake, gameType, options) {
    // let ctx = LoopBackContext.getCurrentContext();
    // console.log(Object.keys(ctx));
    // console.log(Object.keys(Battle.app.loopback.token));
    // console.log(Battle.app.loopback.token());
    // let ctx = Battle.app.ctx;

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
      const error = new Error('Challanger not found');
      error.status = 409;
      throw error;
    }
    const opponent = await UserModel.findById(opponentId);
    if (!opponent) {
      const error = new Error('Opponent not found');
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
      challenger.unstakeFunds(stake);
      throw error;
    }
    try {
      await opponent.stakeFunds(stake);
    } catch (error) {
      challenger.unstakeFunds(stake);
      opponent.unstakeFunds(stake);
      throw error;
    }

    let newBattle = await Battle.create({
      challengerId: challenger.id,
      opponentId: opponent.id,
      status: 'pending',
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
      const error = new Error('Battle is already accepted or declined');
      error.status = 409;
      throw error;
    }

    const updatedBattle = await currentBattle.updateAttribute('status', 'accepted');

    return updatedBattle;
    // TODO

    // AHEU7nyPZGRHy7GkxxkH57zlTlHS4EjWmonBfGPEfOkuTz8dRQlqzkRmbZtV1D54
    // YjzaM1weOK9lX6mkf35tstbmUSndEBe5QPv4qGxujKNy0z6tdid2OlNSi3ZHmr90
  };

  Battle.prototype.declineBattle = async function(options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const opponentId = token && token.userId;

    if (currentBattle.opponentId != opponentId) {
      const error = new Error('You cannot decline someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status != 'pending') {
      const error = new Error('Battle is already accepted or declined');
      error.status = 409;
      throw error;
    }

    const UserModel = Battle.app.models.user;

    const challenger = await UserModel.findById(opponentId);
    const opponent = await UserModel.findById(opponentId);

    const updatedBattle = await currentBattle.updateAttribute('status', 'declined');

    const updatedChallenger = await challenger.releaseFunds(currentBattle.stake);
    const updatedOpponent = await challenger.releaseFunds(currentBattle.stake);

    return updatedBattle;
  };

  Battle.prototype.startBattle = async function(options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const challangerId = token && token.userId;

    if (currentBattle.challangerId != challangerId) {
      const error = new Error('You cannot start someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status != 'started') {
      const error = new Error('You cannot start unaccepted battle');
      error.status = 409;
      throw error;
    }

    const updatedBattle = await currentBattle.updateAttribute('status', 'started');
    
    return updatedBattle;
  };

  Battle.prototype.endBattle = async function(result, options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const callerId = token && token.userId;

    if (currentBattle.challangerId != callerId) {
      const error = new Error('You cannot start someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status != 'started') {
      const error = new Error('You cannot start unaccepted battle');
      error.status = 409;
      throw error;
    }

    if (result == 'lose') {

    } else if (result == 'win') {
      
    }

    const updatedBattle = await currentBattle.updateAttribute('status', 'ended');
  
    return updatedBattle;
  };
};
