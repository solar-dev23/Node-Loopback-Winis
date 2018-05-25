'use strict';

let moment = require('moment-timezone');
let path = require('path');
let express = require('express');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let session = require('cookie-session');

module.exports.startup = function(app) {
  // config views
  app.set('views', __dirname + '/views');
  app.set('view engine', 'pug');

  // middleware
  app.use(bodyParser());
  app.use(cookieParser());
  app.use(session({
    secret: '6GYJ7ExKkTcc5pB8M0K8Gw1PqoGAAWtlRvHKPhA8jDUCZuPM4r',
  }));
  // This is for pictures&css to work
  app.use(require('less-middleware')(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/bower_components', express.static(__dirname + '/bower_components'));

  app.locals.moment = moment;

  app.use(require('./routes'));
};
