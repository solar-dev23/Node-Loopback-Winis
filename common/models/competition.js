
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
    } else {
      status = 'empty';
    }

    return {
      status,
      competition,
    };
  };
};
