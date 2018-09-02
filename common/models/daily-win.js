const moment = require('moment-timezone');

module.exports = function (Dailywin) {
  Dailywin.getBoardAndPickOld = async function (options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Dailywin.app.models.user;
    let user = await UserModel.findById(userId);
    let activeBoard;

    const board = await Dailywin.getBoard(options);
    let { lastAllowedDay } = board;
    try {
      activeBoard = await Dailywin.pickPrize(options);
    } catch (err) {
      if (err.status === 500 || err.status == 404) {
        activeBoard = board;
        lastAllowedDay--;
      } else throw err;
    }

    let prizes = activeBoard.prizes;
    Object.keys(prizes).map((key, index) => {
      const prize = prizes[key];
      if (prize.status === 'picked' && parseInt(key) === lastAllowedDay - 1) {
        prizes[key] = prize;
        prize.status = 'today';
      } else if (prize.status != 'picked') {
        prize.status = 'skipped';
      }
    });
    if (lastAllowedDay === 7) prizes['weekly'].status = 'today';
    activeBoard.prizes = prizes;

    activeBoard.lastAllowedDay--;
    return activeBoard;
  };

  /*
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
        prizes: {
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
        },
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
      currentDailyWin.updateAttributes({
        lastVisitDate: startOfCurrentDay,
        lastAllowedDay: currentDailyWin.lastAllowedDay + 1,
      }),
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
  */

  Dailywin.getStartOfDay = function (timezone) {
    return moment(new Date()).tz(timezone).startOf('day').valueOf();
  };

  Dailywin.getLastDailyWin = async (userId) => {
    const res = await Dailywin.find({
      where: { userId },
      order: 'resetDate DESC',
      limit: 1,
    });

    return res;
  };

  Dailywin.rewardPrize = async function rewardPrize(user, prize) {
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
  };

  Dailywin.getBoard = async function (options) {
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
        createdDate: Dailywin.getStartOfDay(user.timezone),
        resetDate: Dailywin.getStartOfDay(user.timezone) + 7 * 24 * 60 * 60 * 1000 - 1,
        prizes: {
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
        },
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

  Dailywin.pickPrize = async (options) => {
    let activeDailyWin = await Dailywin.getBoard(options);
    let { user } = activeDailyWin;
    const startOfCurrentDay = Dailywin.getStartOfDay(user.timezone);

    // check if valid daily win exists
    if (!activeDailyWin || activeDailyWin.resetDate.getTime() < startOfCurrentDay) {
      const error = new Error('Please check daily win first');
      error.status = 404;
      throw error;
    }

    // prevent double pick
    if (activeDailyWin.lastVisitDate && activeDailyWin.lastVisitDate.getTime() >= startOfCurrentDay) {
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
    await Dailywin.rewardPrize(user, prizes[lastAllowedDay]);
    if (lastAllowedDay >= 7) {
      prizes['weekly'].status = 'picked';
      await Dailywin.rewardPrize(user, prizes['weekly']);
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
