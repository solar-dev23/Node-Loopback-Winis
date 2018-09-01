
const request = require('request');

/**
 * Created SendBirdService instance.
 * @constructor
 * */
function SendBirdService() {
  const SENDBIRD_API = 'https://api.sendbird.com/';
  const SENDBIRD_AUTH = '7a50d0099c241a4a975fad55ceade7f8be020010';

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
