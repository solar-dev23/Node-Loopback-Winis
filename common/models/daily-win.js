'use strict';

const moment = require('moment-timezone');

  // NOTE: Day counting starts from 1
module.exports = function(Dailywin) {
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
    let prizesObject = currentDailyWin.prizes;
    if (currentDailyWin.lastAllowedDay + 1 == 7) {
      prizesObject.weekly.status = 'allowed';
    }
    prizesObject[currentDailyWin.lastAllowedDay].status = 'allowed';
    await currentDailyWin.updateAttribute('prizes', prizesObject);

    return currentDailyWin;
  };

  Dailywin.prototype.pickReward = async function(day, options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Dailywin.app.models.user;

    if (this.userId != userId) {
      const error = new Error('You cannot pick someone else\'s reward');
      error.status = 409;
      throw error;
    }

    if (this.prizes[day].status == 'disallowed') {
      const error = new Error('You cannot pick disallowed reward');
      error.status = 409;
      throw error;
    }

    if (this.prizes[day].status == 'picked') {
      const error = new Error('You have already picked this reward');
      error.status = 409;
      throw error;
    }
    
    let prizesObject = this.prizes;
    prizesObject[day].status = 'picked';
    const updatedDailyWin = await this.updateAttribute('prizes', prizesObject);
    const user = await UserModel.findById(userId);
    // await userId.updateAttribute(); TODO implement prizes
    return updatedDailyWin;
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
          status: 'disallowed',
        },
        '3': {
          prize: 'spin',
          count: 1,
          status: 'disallowed',
        },
        '4': {
          prize: 'winis',
          count: 25,
          status: 'disallowed',
        },
        '5': {
          prize: 'present',
          count: 1,
          status: 'disallowed',
        },
        '6': {
          prize: 'winis',
          count: 50,
          status: 'disallowed',
        },
        '7': {
          prize: 'scratch',
          count: 1,
          status: 'disallowed',
        },
        weekly: {
          prize: 'diamond',
          count: 1,
          status: 'disallowed',
        },
      };
    }
    return next;
  });
};
