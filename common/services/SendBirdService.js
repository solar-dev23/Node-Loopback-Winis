'use strict';

let request = require('request');

/** 
 * Created SendBirdService instance. 
 * @constructor
 * */
function SendBirdService() {
  const SENDBIRD_API = 'https://api.sendbird.com/';
  const SENDBIRD_AUTH = '7a50d0099c241a4a975fad55ceade7f8be020010';

  this.getMessages = function(channelUrl, next) {
    request
      .post({
        url: SENDBIRD_API + 'admin/read_messages',
        json: {
          'auth': SENDBIRD_AUTH,
          'channel_url': channelUrl,
        },
      }, function(err, response, body) {
        return next(err, body);
      });
  };
}

module.exports = SendBirdService;
