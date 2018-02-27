'use strict';

const moment = require('moment-timezone');

module.exports = function(Dailywin) {
  Dailywin.prototype.pickReward = async function(day) {
    const UserModel = Dailywin.app.models.user;
    let self = this.__data;

    if (self.prizes[day].status == 'today') {
      const error = new Error('You have already picked this reward');
      error.status = 409;
      throw error;
    }
    let prizesObject = self.prizes;
    prizesObject[day].status = 'today';
    if (day >= 2 && day <= 7) {
      prizesObject[day - 1].status = 'picked';
    }
    const updatedDailyWin = await this.updateAttribute('prizes', prizesObject);
    const user = await UserModel.findById(self.userId);
    
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
    let user = await UserModel.findById(userId);
    const startOfCurrentDay = Dailywin.getStartOfDay(user.timezone);
    const allActiveDailywin = await Dailywin.find({where: {and: [{userId: userId}, {resetDate: {gt: startOfCurrentDay}}]}});
    let currentDailyWin;

    if (allActiveDailywin.length == 0) {
      currentDailyWin = await Dailywin.create({
        userId: userId,
      });
      await currentDailyWin.pickReward('1');
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
      let result = currentDailyWin;
      const user = await UserModel.findById(userId);
      result.user = user;
      return result;
    }
    await Promise.all([
      currentDailyWin.updateAttribute('lastVisitDate', startOfCurrentDay),
      currentDailyWin.updateAttribute('lastAllowedDay', currentDailyWin.lastAllowedDay + 1),
      currentDailyWin.pickReward(currentDailyWin.lastAllowedDay + 1),
    ]);
    if (currentDailyWin.lastAllowedDay == 7) {
      await currentDailyWin.pickReward('weekly');
    }
    let result = currentDailyWin;
    user = await UserModel.findById(userId);
    result.user = user;
    return result;
  };

  Dailywin.getStartOfDay = function(timezone) {
    return moment(new Date()).tz(timezone).startOf('day').valueOf();
  };

  Dailywin.observe('before save', async function updateTimestamp(ctx, next) {
    if (ctx.isNewInstance) {
      if (!ctx.instance.__data.userId) {
        throw new Error('userId is not set');
      }
      let user = await ctx.Model.app.models.user.findById(ctx.instance.__data.userId); 
      ctx.instance.lastVisitDate = Dailywin.getStartOfDay(user.timezone);
      ctx.instance.createdDate = Dailywin.getStartOfDay(user.timezone);
      ctx.instance.resetDate = Dailywin.getStartOfDay(user.timezone) + 7 * 24 * 60 * 60 * 1000 - 1;
      ctx.instance.prizes = {
        '1': {
          prize: 'winis',
          count: 5,
          status: 'allowed',
        },
        '2': {
          prize: 'winis',
          count: 10,
          status: 'skipped',
        },
        '3': {
          prize: 'spin',
          count: 1,
          status: 'skipped',
        },
        '4': {
          prize: 'winis',
          count: 25,
          status: 'skipped',
        },
        '5': {
          prize: 'present',
          count: 1,
          status: 'skipped',
        },
        '6': {
          prize: 'winis',
          count: 50,
          status: 'skipped',
        },
        '7': {
          prize: 'scratch',
          count: 1,
          status: 'skipped',
        },
        weekly: {
          prize: 'diamond',
          count: 1,
          status: 'skipped',
        },
      };
    }
    return next;
  });
};
