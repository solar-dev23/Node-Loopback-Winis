module.exports = function (Battle) {
  Battle.challenge = async function (opponentId, stake, gameType, options) {
    const token = options && options.accessToken;
    const challengerId = token && token.userId;
    const UserModel = Battle.app.models.user;

    if (!challengerId) {
      const error = new Error('Wrong userToken');
      error.status = 409;
      throw error;
    }

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

    let existingBattle;
    existingBattle = (await Battle.find())
      .filter(value => value.challengerId === challenger.id &&
        value.opponentId === opponent.id &&
        value.result === 'unset' &&
        value.status === 'pending')[0];

    if (!existingBattle) {
      existingBattle = (await Battle.find())
        .filter(value => value.challengerId === opponent.id &&
          value.opponentId === challenger.id &&
          value.result === 'unset' &&
          value.status === 'pending')[0];
    }

    if (existingBattle) {
      const error = new Error('You have already started battle with this user');
      error.status = 409;
      throw error;
    }

    if (challenger.id === opponent.id) {
      const error = new Error('You cannot start battle with yourself');
      error.status = 409;
      throw error;
    }

    await challenger.stakeFunds(stake);
    try {
      await opponent.stakeFunds(stake);
    } catch (error) {
      challenger.releaseFunds(stake);
      const newError = new Error('Opponent doesn’t have enough winis');
      newError.status = 409;
      throw newError;
    }

    const newBattle = await Battle.create({
      challengerId: challenger.id,
      opponentId: opponent.id,
      game: gameType,
      stake,
    });

    return newBattle;
  };

  Battle.prototype.acceptBattle = async function (options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const opponentId = token && token.userId;

    if (currentBattle.opponentId.toString() !== opponentId.toString()) {
      const error = new Error('You cannot accept someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status !== 'pending') {
      const error = new Error('Battle is already accepted or rejected');
      error.status = 409;
      throw error;
    }

    const updatedBattle = await currentBattle.updateAttribute('status', 'accepted');

    return updatedBattle;
  };

  Battle.prototype.rejectBattle = async function (options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const opponentId = token && token.userId;
    const UserModel = Battle.app.models.user;

    if (currentBattle.opponentId.toString() !== opponentId.toString()) {
      const error = new Error('You cannot reject someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status !== 'pending') {
      const error = new Error('Battle is already accepted or rejected');
      error.status = 409;
      throw error;
    }

    const challenger = await UserModel.findById(currentBattle.challengerId);
    const opponent = await UserModel.findById(currentBattle.opponentId);

    await currentBattle.updateAttributes({
      status: 'rejected',
      result: 'finished',
    });

    await challenger.releaseFunds(currentBattle.stake);
    await opponent.releaseFunds(currentBattle.stake);

    return currentBattle;
  };

  /**
   * Cancel a pending battle
   * @param {Function(Error)} callback
   */

  Battle.prototype.cancelBattle = async function (options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const challengerId = token && token.userId.toString();
    const UserModel = Battle.app.models.user;

    if (currentBattle.challengerId.toString() !== challengerId) {
      const error = new Error('You cannot cancel somebody else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status !== 'pending') {
      const error = new Error('You cannot cancel an active battle');
      error.status = 409;
      throw error;
    }

    const challenger = await UserModel.findById(currentBattle.challengerId);
    const opponent = await UserModel.findById(currentBattle.opponentId);

    await currentBattle.updateAttributes({
      status: 'cancelled',
      result: 'finished',
    });

    await challenger.releaseFunds(currentBattle.stake);
    await opponent.releaseFunds(currentBattle.stake);

    return currentBattle;
  };

  Battle.prototype.won = async function (options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const callerId = token && token.userId.toString();
    if (!(currentBattle.challengerId.toString() === callerId ||
      currentBattle.opponentId.toString() === callerId)) {
      const error = new Error('You cannot end someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status !== 'accepted') {
      const error = new Error('You cannot win unaccepted game');
      error.status = 409;
      throw error;
    }

    if (callerId === currentBattle.challengerId.toString()) {
      if (currentBattle.challengerStatus !== 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      }
    } else if (currentBattle.opponentStatus !== 'unset') {
      const error = new Error('You have already commited your status');
      error.status = 409;
      throw error;
    }

    const winnerAttribute = (currentBattle.challengerId.toString() === callerId ?
      'challengerStatus' : 'opponentStatus');

    return currentBattle.updateAttribute(winnerAttribute, 'won');
  };

  Battle.prototype.lost = async function (options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const callerId = token && token.userId.toString();

    if (!(currentBattle.challengerId.toString() === callerId ||
      currentBattle.opponentId.toString() === callerId)) {
      const error = new Error('You cannot end someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status !== 'accepted') {
      const error = new Error('You cannot lose unaccepted game');
      error.status = 409;
      throw error;
    }

    if (callerId === currentBattle.challengerId.toString()) {
      if (currentBattle.challengerStatus !== 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      }
    } else if (currentBattle.opponentStatus !== 'unset') {
      const error = new Error('You have already commited your status');
      error.status = 409;
      throw error;
    }

    const winnerAttribute = (currentBattle.challengerId.toString() === callerId ?
      'challengerStatus' : 'opponentStatus');

    return currentBattle.updateAttribute(winnerAttribute, 'lost');
  };

  Battle.prototype.draw = async function (options) {
    const currentBattle = this;
    const token = options && options.accessToken;
    const callerId = token && token.userId.toString();

    if (!(currentBattle.challengerId.toString() === callerId ||
      currentBattle.opponentId.toString() === callerId)) {
      const error = new Error('You cannot end someone else\'s battle');
      error.status = 409;
      throw error;
    }

    if (currentBattle.status !== 'accepted') {
      const error = new Error('You cannot draw unaccepted game');
      error.status = 409;
      throw error;
    }

    if (callerId === currentBattle.challengerId.toString()) {
      if (currentBattle.challengerStatus !== 'unset') {
        const error = new Error('You have already commited your status');
        error.status = 409;
        throw error;
      }
    } else if (currentBattle.opponentStatus !== 'unset') {
      const error = new Error('You have already commited your status');
      error.status = 409;
      throw error;
    }

    const winnerAttribute = (currentBattle.challengerId.toString() === callerId ?
      'challengerStatus' : 'opponentStatus');

    return currentBattle.updateAttribute(winnerAttribute, 'draw');
  };

  Battle.observe('before save', async (ctx) => {
    const UserModel = Battle.app.models.user;

    if (ctx.currentInstance) {
      let bothUpdated = false;
      if (ctx.data.challengerStatus) {
        if (ctx.currentInstance.opponentStatus !== 'unset') {
          bothUpdated = true;
        }
      }
      if (ctx.data.opponentStatus) {
        if (ctx.currentInstance.challengerStatus !== 'unset') {
          bothUpdated = true;
        }
      }
      if (bothUpdated) {
        if (ctx.currentInstance.status === 'accepted') {
          ctx.data.status = 'finished';
          if (ctx.data.challengerStatus === 'won' && ctx.currentInstance.opponentStatus === 'lost') {
            const winner = await UserModel.findById(ctx.currentInstance.challengerId);
            const losser = await UserModel.findById(ctx.currentInstance.opponentId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'challenger won';
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
            await winner.updateAttribute('diamonds', winner.diamonds + 1);
          } else if (ctx.currentInstance.challengerStatus === 'won' && ctx.data.opponentStatus === 'lost') {
            const winner = await UserModel.findById(ctx.currentInstance.challengerId);
            const losser = await UserModel.findById(ctx.currentInstance.opponentId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'challenger won';
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
            await winner.updateAttribute('diamonds', winner.diamonds + 1);
          } else if (ctx.data.challengerStatus === 'lost' && ctx.currentInstance.opponentStatus === 'won') {
            const winner = await UserModel.findById(ctx.currentInstance.opponentId);
            const losser = await UserModel.findById(ctx.currentInstance.challengerId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'opponent won';
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
            await winner.updateAttribute('diamonds', winner.diamonds + 1);
          } else if (ctx.currentInstance.challengerStatus === 'lost' && ctx.data.opponentStatus === 'won') {
            const winner = await UserModel.findById(ctx.currentInstance.opponentId);
            const losser = await UserModel.findById(ctx.currentInstance.challengerId);
            await winner.releaseFunds(ctx.currentInstance.stake);
            await losser.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'opponent won';
            await UserModel.transferFunds(ctx.currentInstance.stake, losser, winner);
            await winner.updateAttribute('diamonds', winner.diamonds + 1);
          } else if (ctx.data.challengerStatus === 'draw' && ctx.currentInstance.opponentStatus === 'draw') {
            const drawwer1 = await UserModel.findById(ctx.currentInstance.opponentId);
            const drawwer2 = await UserModel.findById(ctx.currentInstance.challengerId);
            await drawwer1.releaseFunds(ctx.currentInstance.stake);
            await drawwer2.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'both draw';
          } else if (ctx.currentInstance.challengerStatus === 'draw' && ctx.data.opponentStatus === 'draw') {
            const drawwer1 = await UserModel.findById(ctx.currentInstance.opponentId);
            const drawwer2 = await UserModel.findById(ctx.currentInstance.challengerId);
            await drawwer1.releaseFunds(ctx.currentInstance.stake);
            await drawwer2.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'both draw';
          } else {
            const drawwer1 = await UserModel.findById(ctx.currentInstance.opponentId);
            const drawwer2 = await UserModel.findById(ctx.currentInstance.challengerId);
            await drawwer1.releaseFunds(ctx.currentInstance.stake);
            await drawwer2.releaseFunds(ctx.currentInstance.stake);
            ctx.data.result = 'error state';
          }
        }
      }
    }
  });
};
