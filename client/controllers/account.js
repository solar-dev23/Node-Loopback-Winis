'use strict';

let express = require('express');
let router = express.Router();
let loginModule = require('../utils/login');
let _ = require('lodash');
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

  const entry = await loginModule.authenticate(app, req.body.email, req.body.password);
  console.log(entry);
  if (entry) {
    debug('Successful login to "%s" from %s', req.body.email, req.connection.remoteAddress);
    req.session.user = entry;
    res.redirect('/');
  } else {
    debug('Unsuccessful login attempt to "%s" from %s', req.body.email, req.connection.remoteAddress);
    res.redirect('login?error');
  }
});

router.get('/logout', auth, function(req, res) {
  req.session = null;
  res.redirect('/');
});

router.get('/changepass', auth, function(req, res) {
  // let app = req.app;

  // res.render('account/changepass', _.defaults(utils.getRequestVariables(app, req), {
  //   pageName: 'Change Password',
  // }));
});

router.post('/changepass', auth, function(req, res) {
  // let app = req.app;

  // if (req.body.new_pass1 == '') {
  //   res.send('Please insert new password');
  //   return;
  // }

  // if (req.body.new_pass1 != req.body.new_pass2) {
  //   res.send('Passwords don\'t match');
  //   return;
  // }

  // loginModule.authenticate(app, req.session.user.email, req.body.current_pass, function(result) {
  //   if (!result) {
  //     res.send('Current password is not valid');
  //   } else {
  //     app.models.User.findById(req.session.user.id, function(err, user) {
  //       user.updateAttribute('password', req.body.new_pass1);
  //       console.log('User ' + req.session.user.email + ' has changed password');
  //       res.send('');
  //     });
  //   }
  // });
});

module.exports = router;
