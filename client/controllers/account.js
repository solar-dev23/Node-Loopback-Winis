'use strict';

let express = require('express');
let router = express.Router();
let loginModule = require('../utils/login');
let debug = require('debug')('admin:account');
let utils = require('../utils/utils');
let auth = require('../middlewares/auth');

router.get('/login', async function(req, res) {
  res.render('account/login', {
    isError: req.query.error != undefined,
  });
});

// Check user login post
router.post('/login', async function(req, res) {
  let app = req.app;
  const entry = await loginModule.authenticate(app, req.body.login, req.body.password);
  if (entry) {
    debug('Successful login to "%s" from %s', req.body.login, req.connection.remoteAddress);
    req.session.user = entry;
    res.redirect('/');
  } else {
    debug('Unsuccessful login attempt to "%s" from %s', req.body.login, req.connection.remoteAddress);
    res.redirect('login?error');
  }
});

router.get('/logout', auth, function(req, res) {
  req.session = null;
  res.redirect('/');
});

router.get('/changepass', auth, function(req, res) {
  const app = req.app;

  res.render('account/changepass', Object.assign(utils.getRequestVariables(app, req), {
    pageName: 'Change Password',
  }));
});

router.post('/changepass', auth, async function(req, res) {
  const app = req.app;

  if (req.body.newPass1 == '') {
    res.send('Please insert new password');
    return;
  }

  if (req.body.newPass1 != req.body.newPass2) {
    res.send('Passwords don\'t match');
    return;
  }

  const result = await loginModule.authenticate(app, req.session.user.login, req.body.currentPass);
  if (!result) {
    res.send('Current password is not valid');
  } else {
    await app.models.user.changeAdminPassword(req.session.user.id, req.body.newPass1);
    res.send('');
  }
});

module.exports = router;
