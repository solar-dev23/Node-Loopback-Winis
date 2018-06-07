'use strict';

module.exports =
{
  getRequestVariables: function(app, req) {
    return {
      user: req.session.user
    };
  },
};

