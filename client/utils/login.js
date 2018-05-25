'use strict';

exports.authenticate = async function(app, login, pass) {
  const user = await app.models.user.loginAdmin({
    login: login,
    password: pass,
  });

  return user;
};
