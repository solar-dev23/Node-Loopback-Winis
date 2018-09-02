
const moment = require('moment');
const momenttz = require('moment-timezone');

module.exports = function (Competition) {
  Competition.getStartOfDay = function (timezone) {
    return momenttz(new Date()).tz(timezone).startOf('day').valueOf();
  };

  /**
   * Return the current or next competition
   * @param {Function(Error, object)} callback
   */
  Competition.nearest = async function () {
    const startOfCurrentDay = Competition.getStartOfDay('UTC');
    const competition = await Competition.findOne({ where: { endDate: { gt: startOfCurrentDay } } });
    let status;

    if (competition) {
      if (moment(competition.startDate).isBefore(startOfCurrentDay)) {
        status = 'running';
      } else {
        status = 'pending';
      }
      await competition.updateAttributes({ status });
    } else {
      status = 'empty';
    }

    return {
      status,
      competition,
    };
  };

  Competition.pickWinner = async () => {
    const startOfCurrentDay = Competition.getStartOfDay('UTC');
    const competition = await Competition.findOne({ where: { endDate: { lt: startOfCurrentDay } } });
    if (!competition || (competition.status && competition.status !== 'running')) {
      const error = new Error('The competition is invalid');
      error.status = 403;
      throw error;
    }
    const { app } = Competition;
    const { User } = app.models;
    const winner = await User.findOne({ where: {}, order: 'diamonds DESC' });
    await competition.updateAttributes({
      userId: winner.id,
      status: 'closed',
    });
    await User.updateAll({}, { diamonds: 0 });
    return {
      winner,
    };
  };
};
