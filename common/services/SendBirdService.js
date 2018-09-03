
const request = require('request');
const sha256 = require('js-sha256');
const SENDBIRD_AUTH = '7a50d0099c241a4a975fad55ceade7f8be020010';
const SENDBIRD_API = 'https://api.sendbird.com/';

/**
 * Created SendBirdService instance.
 * @constructor
 * */
function SendBirdService() {
  this.getMessages = function (channelUrl, next) {
    /* eslint-disable camelcase */
    request
      .post({
        url: `${SENDBIRD_API}admin/read_messages`,
        json: {
          auth: SENDBIRD_AUTH,
          channel_url: channelUrl,
        },
      }, (err, response, body) => next(err, body));
    /* eslint-enable camelcase */
  };
}

module.exports = SendBirdService;
module.exports.createSignature = (body) => {
  const hash2 = sha256.hmac.update(SENDBIRD_AUTH, body);

  return hash2.hex();
};
