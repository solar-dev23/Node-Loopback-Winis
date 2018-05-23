// var moment = require('moment-timezone');
// var mongoShortId = require('base64-mongo-id');
'use strict';
let moment = require('moment-timezone');

module.exports.startup = function(app) {
  let path = require('path');
  let express = require('express');
  let cookieParser = require('cookie-parser');
  let bodyParser = require('body-parser');
  let session = require('cookie-session');

  // config views
  app.set('views', __dirname + '/views');
  app.set('view engine', 'pug');

  //   // middleware
  app.use(bodyParser());
  app.use(cookieParser());
  app.use(session({
    secret: '6GYJ7ExKkTcc5pB8M0K8Gw1PqoGAAWtlRvHKPhA8jDUCZuPM4r',
  }));
  //   // This is for pictures&css to work
  app.use(require('less-middleware')(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/bower_components', express.static(__dirname + '/bower_components'));

  app.locals.moment = moment;
  //   app.locals.shortId = mongoShortId;

  app.use(require('./routes'));
};
