let _ = require('lodash');

// The password check function
// fn = next function. gets null if error, otherwise the collection entry
/* Example of returned argument:
 { admin: true,
 organization: 'test organization',
 name: 'Test Test',
 login: 'test@test.com',
 id: '56d5f81d25162eac63ae057b' }
 */

exports.authenticate = async function(app, login, pass) {
  const user = await app.models.user.loginAdmin({
    login: login, // must provide login or "username"
    password: pass, // required by default
  });

  if (typeof user.avatar == 'undefined') {
    user.avatar = '/img/avatar.png';
  }

  return user;
};
