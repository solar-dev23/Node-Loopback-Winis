'use strict';

module.exports =
{
  getRequestVariables: function(app, req) {
    return {
      currentUserId: req.session.user.id,
      currentUser: req.session.user
    };
  },
};

