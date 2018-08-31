
const moment = require('moment-timezone');

module.exports = function (Dailywin) {
  Dailywin.prototype.pickReward = async function (day) {
    const UserModel = Dailywin.app.models.user;
    const self = this.__data;

    if (self.prizes[day].status == 'today') {
      const error = new Error('You have already picked this reward');
      error.status = 409;
      throw error;
    }
    const prizesObject = self.prizes;
    prizesObject[day].status = 'today';
    if (day >= 2 && day <= 7) {
      prizesObject[day - 1].status = 'picked';
    }
    const updatedDailyWin = await this.updateAttribute('prizes', prizesObject);
    const user = await UserModel.findById(self.userId);

    switch (prizesObject[day].prize) {
      case 'empty':
        break;
      case 'diamond':
        await user.updateAttribute('diamonds', user.diamonds + prizesObject[day].count);
        break;
      case 'winis':
        await user.updateAttribute('winis', user.winis + prizesObject[day].count);
        break;
      case 'scratch':
        await user.updateAttribute('scratches', user.scratches + prizesObject[day].count);
        break;
      case 'present':
        await Promise.all([
          user.updateAttribute('diamonds', user.diamonds + 1 * prizesObject[day].count),
          user.updateAttribute('winis', user.winis + 10 * prizesObject[day].count),
          user.updateAttribute('scratches', user.scratches + 1 * prizesObject[day].count),
          user.updateAttribute('spins', user.spins + 1 * prizesObject[day].count),
        ]);
        break;
      case 'spin':
        await user.updateAttribute('spins', user.spins + prizesObject[day].count);
        break;
    }
    return updatedDailyWin;
  };

  Dailywin.check = async function (options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Dailywin.app.models.user;
    let user = await UserModel.findById(userId);
    const startOfCurrentDay = Dailywin.getStartOfDay(user.timezone);
    const allActiveDailywin = await Dailywin.find({
      where: { and:
        [
          { userId },
          { resetDate: { gt: startOfCurrentDay } },
        ],
      },
    });
    let currentDailyWin;

    if (allActiveDailywin.length == 0) {
      currentDailyWin = await Dailywin.create({
        userId,
        version: 1,
      });
      await currentDailyWin.pickReward('1');
    } else if (allActiveDailywin.length == 1) {
      currentDailyWin = allActiveDailywin[0];
    } else {
      const error = new Error('Too many daily-win instances');
      error.status = 500;
      throw error;
    }
    if (!currentDailyWin.lastVisitDate) {
      currentDailyWin.updateAttribute('lastVisitDate', startOfCurrentDay);
    }
    if (currentDailyWin.lastVisitDate.getTime() > startOfCurrentDay) {
      const error = new Error('Time error');
      error.status = 500;
      throw error;
    }

    if (currentDailyWin.lastVisitDate.getTime() == startOfCurrentDay) {
      const result = currentDailyWin;
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
    const result = currentDailyWin;
    user = await UserModel.findById(userId);
    result.user = user;
    return result;
  };

  Dailywin.getStartOfDay = function (timezone) {
    return moment(new Date()).tz(timezone).startOf('day').valueOf();
  };

  Dailywin.observe('before save', async (ctx, next) => {
    if (ctx.isNewInstance) {
      if (!ctx.instance.__data.userId) {
        throw new Error('userId is not set');
      }
      const user = await ctx.Model.app.models.user.findById(ctx.instance.__data.userId);
      if (ctx.instance.version != 2) {
        ctx.instance.lastVisitDate = Dailywin.getStartOfDay(user.timezone);
      }
      ctx.instance.createdDate = Dailywin.getStartOfDay(user.timezone);
      ctx.instance.resetDate = Dailywin.getStartOfDay(user.timezone) + 7 * 24 * 60 * 60 * 1000 - 1;
      ctx.instance.prizes = ctx.instance.version == 2 ? {
        '1': {
          prize: 'winis',
          count: 5,
          status: 'allowed',
        },
        '2': {
          prize: 'winis',
          count: 10,
          status: 'pending',
        },
        '3': {
          prize: 'spin',
          count: 1,
          status: 'pending',
        },
        '4': {
          prize: 'winis',
          count: 25,
          status: 'pending',
        },
        '5': {
          prize: 'present',
          count: 1,
          status: 'pending',
        },
        '6': {
          prize: 'winis',
          count: 50,
          status: 'pending',
        },
        '7': {
          prize: 'scratch',
          count: 1,
          status: 'pending',
        },
        weekly: {
          prize: 'diamond',
          count: 100,
          status: 'pending',
        },
      } : {
        '1': {
          prize: 'winis',
          count: 5,
          status: 'allowed',
        },
        2: {
          prize: 'winis',
          count: 10,
          status: 'skipped',
        },
        3: {
          prize: 'spin',
          count: 1,
          status: 'skipped',
        },
        4: {
          prize: 'winis',
          count: 25,
          status: 'skipped',
        },
        5: {
          prize: 'present',
          count: 1,
          status: 'skipped',
        },
        6: {
          prize: 'winis',
          count: 50,
          status: 'skipped',
        },
        7: {
          prize: 'scratch',
          count: 1,
          status: 'skipped',
        },
        weekly: {
          prize: 'diamond',
          count: 100,
          status: 'skipped',
        },
      };
    }
    return next;
  });

  Dailywin.getLastDailyWin = async (userId) => {
    const res = await Dailywin.find({
      where: { userId },
      order: 'resetDate DESC',
      limit: 1,
    });

    return res;
  };

  async function rewardPrize(user, prize) {
    switch (prize.prize) {
      case 'empty':
        break;
      case 'diamond':
        await user.updateAttribute('diamonds', user.diamonds + prize.count);
        break;
      case 'winis':
        await user.updateAttribute('winis', user.winis + prize.count);
        break;
      case 'scratch':
        await user.updateAttribute('scratches', user.scratches + prize.count);
        break;
      case 'present':
        await user.updateAttributes({
          diamonds: user.diamonds + 1 * prize.count,
          winis: user.winis + 10 * prize.count,
          scratches: user.scratches + 1 * prize.count,
          spins: user.spins + 1 * prize.count,
        });
        break;
      case 'spin':
        await user.updateAttribute('spins', user.spins + prize.count);
        break;
    }

    return user;
  }

  Dailywin.nearest = async function(options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Dailywin.app.models.user;
    let user = await UserModel.findById(userId);
    const startOfCurrentDay = Dailywin.getStartOfDay(user.timezone);
    let [activeDailyWin] = await Dailywin.getLastDailyWin(userId);

    // mark past dailywin as missed
    if (activeDailyWin && activeDailyWin.resetDate.getTime() < startOfCurrentDay) {
      let { prizes } = activeDailyWin;
      Object.keys(prizes).forEach(key => {
        if (prizes[key].status !== 'picked') {
          prizes[key].status = 'missed';
        }
      });
      await activeDailyWin.updateAttribute('prizes', prizes);
    }

    if (!activeDailyWin || activeDailyWin.resetDate.getTime() < startOfCurrentDay) {
      activeDailyWin = await Dailywin.create({
        userId: userId,
      });
    }

    let { prizes, lastAllowedDay } = activeDailyWin;
    // mark today's daily win allowed
    if (prizes[activeDailyWin.lastAllowedDay].status === 'pending') {
      prizes[activeDailyWin.lastAllowedDay].status = 'allowed';
    }
    // check if there is any missed day
    const dayNumber = moment(startOfCurrentDay).diff(moment(activeDailyWin.createdDate), 'days') + 1;
    if (dayNumber > lastAllowedDay) {
      prizes['weekly'].status = 'missed';
      for (let i = 0; i < dayNumber - lastAllowedDay; i += 1) {
        prizes[7 - i].status = 'missed';
      }
    }
    await activeDailyWin.updateAttribute('prizes', prizes);

    activeDailyWin.user = user;

    return activeDailyWin;
  };

  Dailywin.pick = async (options) => {
    let activeDailyWin = await Dailywin.nearest(options);
    let { user } = activeDailyWin;
    const startOfCurrentDay = Dailywin.getStartOfDay(user.timezone);

    // check if valid daily win exists
    if (!activeDailyWin || activeDailyWin.resetDate.getTime() < startOfCurrentDay) {
      const error = new Error('Please check daily win first');
      error.status = 404;
      throw error;
    }

    // prevent double pick
    if (activeDailyWin.lastVisitDate.getTime() >= startOfCurrentDay) {
      const error = new Error('Time error');
      error.status = 500;
      throw error;
    }

    let { prizes, lastAllowedDay } = activeDailyWin;
    if (prizes[lastAllowedDay].status !== 'allowed') {
      const error = new Error('You have picked today already or missed');
      error.status = 404;
      throw error;
    }

    prizes[lastAllowedDay].status = 'picked';
    await rewardPrize(user, prizes[lastAllowedDay]);
    if (lastAllowedDay >= 7) {
      prizes['weekly'].status = 'picked';
      await rewardPrize(user, prizes['weekly']);
    } else if (prizes[lastAllowedDay + 1].status === 'pending') {
      prizes[lastAllowedDay + 1].status = 'allowed';
    }

    await activeDailyWin.updateAttributes({
      prizes,
      lastAllowedDay: lastAllowedDay + 1,
      lastVisitDate: startOfCurrentDay,
    });

    activeDailyWin.user = user;

    return activeDailyWin;
  };
};
