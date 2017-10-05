'use strict';

const debug = require('debug')('Winis:UserModel');
const request = require('request-promise');

module.exports = function(User) {
  delete User.validations.email;
  delete User.validations.password;

  User.authenticate = async function(method, credentials) {
    switch (method) {
      case 'accountkit':
        const token = credentials.token;
        const authResponse = await request({
          uri: `https://graph.accountkit.com/v1.2/me/?access_token=${token}`,
          json: true,
        });

        if (authResponse.application &&
          authResponse.application.id !== '224347058051395') {
          throw new Error('Wrong application');
        }

        const userAttributes = {
          'externalUserId': authResponse.id,
          'externalAuthMethod': method,
        };

        const phoneNumber = authResponse.phone.number;
        const [user, created] = await User.findOrCreate({where: userAttributes}, Object.assign({}, userAttributes, {
          phoneNumber: phoneNumber,
        }));

        if (!created && phoneNumber !== user.phoneNumber) {
          user.phoneNumber = phoneNumber;
          await user.save();
        }

        const accessToken = await user.createAccessToken();
        return {
          acessToken: accessToken,
          user: user,
        };
    }
  };

  User.findByPhones = async (phones) => {
    const users = await User.find({phoneNumber: {in: phones}});
    return users;
  };

  User.prototype.sendWinis = function(amount, userID, options) {
    debug(`Sending ${amount} of winis to ${userID}`);
  };

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
