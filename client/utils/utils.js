'use strict';

module.exports =
{
  getRequestVariables: function(app, req) {
    return {
      username: req.session.user.adminLogin,
      avatar: req.session.user.avatar,
    };
  },
};

