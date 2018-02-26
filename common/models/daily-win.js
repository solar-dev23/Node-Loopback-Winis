'use strict';

const moment = require('moment-timezone');

  // NOTE: Day counting starts from 1
  // picked, picked, picked, today, skiped, skiped, skiped
module.exports = function(Dailywin) {
  Dailywin.prototype.pickReward = async function(day, options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Dailywin.app.models.user;
    let self = this.__data;
    if (self.userId != userId) {
      const error = new Error('You cannot pick someone else\'s reward');
      error.status = 409;
      throw error;
    }

    if (self.prizes[day].status == 'skiped') {
      const error = new Error('You cannot pick disallowed reward');
      error.status = 409;
      throw error;
    }

    if (self.prizes[day].status == 'today') {
      const error = new Error('You have already picked this reward');
      error.status = 409;
      throw error;
    }
    
    let prizesObject = self.prizes;
    prizesObject[day].status = 'today';
    const updatedDailyWin = await this.updateAttribute('prizes', prizesObject);
    const user = await UserModel.findById(userId);
    
    switch (prizesObject[day].prize) {
      case 'empty': break;
      case 'diamond': await user.updateAttribute('diamonds', user.diamonds + prizesObject[day].count); break;
      case 'winis':  await user.updateAttribute('winis', user.winis + prizesObject[day].count); break;
      case 'scratch': await user.updateAttribute('scratches', user.scratches + prizesObject[day].count); break;
      case 'present': await Promise.all([
        user.updateAttribute('diamonds', user.diamonds + 1 * prizesObject[day].count), 
        user.updateAttribute('winis', user.winis + 10 * prizesObject[day].count),
        user.updateAttribute('scratches', user.scratches + 1 * prizesObject[day].count),
        user.updateAttribute('spins', user.spins + 1 * prizesObject[day].count),
      ]); break;
      case 'spin': await user.updateAttribute('spins', user.spins + prizesObject[day].count); break;
    }
    return updatedDailyWin;
  };

  Dailywin.check = async function(options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Dailywin.app.models.user;
    const user = await UserModel.findById(userId);
    const startOfCurrentDay = moment(new Date()).tz(user.timezone).startOf('day').valueOf();
    const allActiveDailywin = await Dailywin.find({where: {and: [{userId: userId}, {resetDate: {gt: startOfCurrentDay}}]}});
    let currentDailyWin;

    if (allActiveDailywin.length == 0) {
      currentDailyWin = await Dailywin.create({
        userId: userId,
      });
      await currentDailyWin.pickReward('1', options);
    } else if (allActiveDailywin.length == 1) {
      currentDailyWin = allActiveDailywin[0];
    } else {
      const error = new Error('To many daily-win instances');
      error.status = 500;
      throw error;
    }

    if (currentDailyWin.lastVisitDate > startOfCurrentDay) {
      const error = new Error('Time error');
      error.status = 500;
      throw error;
    }

    if (currentDailyWin.lastVisitDate == startOfCurrentDay) {
      return currentDailyWin;
    }

    await currentDailyWin.updateAttribute('lastVisitDate', startOfCurrentDay);
    await currentDailyWin.updateAttribute('lastAllowedDay', currentDailyWin.lastAllowedDay + 1);
    await currentDailyWin.pickReward(currentDailyWin.lastAllowedDay, options);
    if (currentDailyWin.lastAllowedDay == 7) {
      await currentDailyWin.pickReward('weekly', options);
    }

    return currentDailyWin;
  };

  Dailywin.observe('before save', async function updateTimestamp(ctx, next) {
    if (ctx.isNewInstance) {
      if (!ctx.instance.__data.userId) {
        throw new Error('userId is not set');
      }
      let user = await ctx.Model.app.models.user.findById(ctx.instance.__data.userId); 
      ctx.instance.lastVisitDate = moment(new Date()).tz(user.timezone).startOf('day').valueOf();
      ctx.instance.createdDate = moment(new Date()).tz(user.timezone).startOf('day').valueOf();
      ctx.instance.resetDate = moment(new Date()).tz(user.timezone).startOf('day').valueOf() + 7 * 24 * 60 * 60 * 1000 - 1;
      ctx.instance.prizes = {
        '1': {
          prize: 'winis',
          count: 5,
          status: 'allowed',
        },
        '2': {
          prize: 'winis',
          count: 10,
          status: 'skiped',
        },
        '3': {
          prize: 'spin',
          count: 1,
          status: 'skiped',
        },
        '4': {
          prize: 'winis',
          count: 25,
          status: 'skiped',
        },
        '5': {
          prize: 'present',
          count: 1,
          status: 'skiped',
        },
        '6': {
          prize: 'winis',
          count: 50,
          status: 'skiped',
        },
        '7': {
          prize: 'scratch',
          count: 1,
          status: 'skiped',
        },
        weekly: {
          prize: 'diamond',
          count: 1,
          status: 'skiped',
        },
      };
    }
    return next;
  });
};
