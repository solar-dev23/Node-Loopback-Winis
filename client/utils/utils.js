module.exports =
{
  getRequestVariables: function(app, req) {
    return {
      _username: req.session.user.username || req.session.user.name,
      _avatar: req.session.user.avatar,
      _email: req.session.user.email,
    };
  },
};

