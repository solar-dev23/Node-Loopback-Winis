const moment = require('moment-timezone');

module.exports = DailyWin => {
  DailyWin.getBoardAndPickOld = async options => {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = DailyWin.app.models.user;
    let user = await UserModel.findById(userId);
    let activeBoard;

    const board = await DailyWin.getBoard(options);
    try {
      activeBoard = await DailyWin.pickPrize(options);
    } catch (err) {
      if (err.status === 500 || err.status == 404) {
        activeBoard = board;
      } else throw err;
    }

    let { lastAllowedDay } = activeBoard;
    let prizes = activeBoard.prizes;
    Object.keys(prizes).map((key, index) => {
      const prize = prizes[key];
      if (prize.status !== 'picked' && prize.status !== 'today') {
        prize.status = 'skipped';
      }
    });
    activeBoard.prizes = prizes;

    activeBoard.lastAllowedDay--;
    return activeBoard;
  };

  /*
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = DailyWin.app.models.user;
    let user = await UserModel.findById(userId);
    const startOfCurrentDay = DailyWin.getStartOfDay(user.timezone);
    const allActiveDailyWin = await DailyWin.find({
      where: { and:
        [
          { userId },
          { resetDate: { gt: startOfCurrentDay } },
        ],
      },
    });

    let currentDailyWin;

    if (allActiveDailyWin.length == 0) {
      currentDailyWin = await DailyWin.create({
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
    } else if (allActiveDailyWin.length == 1) {
      currentDailyWin = allActiveDailyWin[0];
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

  DailyWin.getStartOfDay = timezone => {
    return moment(new Date())
      .tz(timezone)
      .startOf('day')
      .valueOf();
  };

  DailyWin.getLastDailyWin = async userId => {
    const res = await DailyWin.find({
      where: { userId },
      order: 'resetDate DESC',
      limit: 1,
    });

    return res;
  };

  DailyWin.rewardPrize = async function rewardPrize(user, prize) {
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

  DailyWin.applyToday = dailywin => {
    const { prizes, lastAllowedDay } = dailywin;

    if (lastAllowedDay > 1 && prizes[lastAllowedDay - 1].status === 'picked') {
      prizes[lastAllowedDay - 1].status = 'today';
    }
    if (prizes['weekly'].status === 'picked') {
      prizes['weekly'].status = 'today';
    }

    return dailywin;
  };

  DailyWin.getActiveDailyWin = async options => {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = DailyWin.app.models.user;
    let user = await UserModel.findById(userId);
    const startOfCurrentDay = DailyWin.getStartOfDay(user.timezone);
    let [activeDailyWin] = await DailyWin.getLastDailyWin(userId);

    // mark past dailywin as missed
    if (
      activeDailyWin &&
      activeDailyWin.resetDate.getTime() < startOfCurrentDay
    ) {
      let { prizes } = activeDailyWin;
      Object.keys(prizes).forEach(key => {
        if (prizes[key].status !== 'picked') {
          prizes[key].status = 'missed';
        }
      });
      await activeDailyWin.updateAttribute('prizes', prizes);
    }

    if (
      !activeDailyWin ||
      activeDailyWin.resetDate.getTime() < startOfCurrentDay
    ) {
      activeDailyWin = await DailyWin.create({
        userId: userId,
        createdDate: DailyWin.getStartOfDay(user.timezone),
        resetDate:
          DailyWin.getStartOfDay(user.timezone) + 7 * 24 * 60 * 60 * 1000 - 1,
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
    const dayNumber =
      moment(startOfCurrentDay).diff(
        moment(activeDailyWin.createdDate),
        'days'
      ) + 1;
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

  DailyWin.getBoard = async options => {
    const activeDailyWin = await DailyWin.getActiveDailyWin(options);

    return DailyWin.applyToday(activeDailyWin);
  };

  DailyWin.pickPrize = async options => {
    let activeDailyWin = await DailyWin.getActiveDailyWin(options);
    let { user } = activeDailyWin;
    const startOfCurrentDay = DailyWin.getStartOfDay(user.timezone);

    // check if valid daily win exists
    if (
      !activeDailyWin ||
      activeDailyWin.resetDate.getTime() < startOfCurrentDay
    ) {
      const error = new Error('Please check daily win first');
      error.status = 404;
      throw error;
    }

    // prevent double pick
    if (
      activeDailyWin.lastVisitDate &&
      activeDailyWin.lastVisitDate.getTime() >= startOfCurrentDay
    ) {
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
    await DailyWin.rewardPrize(user, prizes[lastAllowedDay]);
    if (lastAllowedDay >= 7) {
      prizes['weekly'].status = 'picked';
      await DailyWin.rewardPrize(user, prizes['weekly']);
    } else if (prizes[lastAllowedDay + 1].status === 'pending') {
      prizes[lastAllowedDay + 1].status = 'allowed';
    }

    await activeDailyWin.updateAttributes({
      prizes,
      lastAllowedDay: lastAllowedDay + 1,
      lastVisitDate: startOfCurrentDay,
    });

    activeDailyWin.user = user;

    return DailyWin.applyToday(activeDailyWin);
  };
};
