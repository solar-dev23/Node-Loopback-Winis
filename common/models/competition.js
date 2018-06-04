'use strict';

module.exports = function(Competition) {
  /**
   * Return the current or next competition
   * @param {Function(Error, object)} callback
   */

  Competition.next = async function(callback) {
    const competition = await Competition.findOne({order: 'endDate ASC'});
    callback(null, competition);
  };
};
