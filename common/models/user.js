'use strict';

const debug = require('debug')('Winis:UserModel');

module.exports = function(User) {
  delete User.validations.email;
  User.prototype.handlePrize = function(prize) {
    debug(`Handle prize ${prize}`);

    switch(prize) {
      case 'diamond':
        this.diamonds++;
        break;
      case 'present':
        debug('Need to handle present');
        break;
      case 'double_spin':
        this.spins += 2;
        break;
      case '5_winis':
        this.winis += 5;
        break;
      case 'double_diamond':
        this.diamonds += 2;
        break;
      case '2_winis':
        this.winis += 2;
        break;
      case 'double_scratch':
        this.scratches += 2;
        break;
      case 'scratch':
        this.scratch++;
        break;
      case 'spin':
        this.spins++;
        break;
      default:
        break;
    }
  };
};
