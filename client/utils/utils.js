'use strict';

module.exports =
{
  getRequestVariables: function(app, req) {
    console.log(req.session);
    return {
      username: req.session.user.adminLogin,
      avatar: req.session.user.avatar,
    };
  },
};

