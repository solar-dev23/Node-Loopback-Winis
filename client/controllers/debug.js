'use strict';

let express = require('express');
let router = express.Router();
let auth = require('../middlewares/auth');
let async = require('async');
let _ = require('lodash');
let utils = require('../utils/utils');

router.get('/', auth, function(req, res) {
//   let app = req.app;

//   res.render('debug', _.defaults(utils.getRequestVariables(app, req), {
//     _debug_active: 'active',
//     pageName: 'Debug',
//   }));
});

router.get('/push-test', function(req, res, cb) {
//   let app = req.app,
//     Notification = app.models.notification,
//     PushModel = app.models.push;

//   let alert = 'Hello, Vlad!';

//   let note = new Notification({
//     badge: 0,
//     sound: 'ksahgdfkldb.caf',
//     alert: alert,
//   });

//   let userId = '585013571072b81200901ef5';

//   PushModel.notifyByQuery({userId: userId}, note, function(err) {
//     if (err) {
//       console.error('Cannot notify %j: %s', userId, err.stack);
//     }
//     console.log('pushing notification to %j', userId);

//     return cb(err);
//   });

//   res.send('Sent to user');

//   return cb();
});

module.exports = router;
