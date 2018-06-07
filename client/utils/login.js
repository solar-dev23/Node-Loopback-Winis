'use strict';

exports.authenticate = async function(app, username, pass) {
  const user = await app.models.user.login({
    username: username,
    password: pass,
  });

  return user;
};
