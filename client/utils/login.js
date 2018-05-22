'use strict';
const md5 = require('md5');
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
    login: login,
    password: pass,
  });

  return user;
};
