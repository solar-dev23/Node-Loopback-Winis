'use strict';

let express = require('express');
let router = express.Router();
let auth = require('../middlewares/auth');

let _ = require('lodash');
let utils = require('../utils/utils');

router.get('/', auth, function(req, res) {
  let app = req.app;
  //   Chats = app.models.chatLog,
  //   Users = app.models.user,
  //   Adverts = app.models.advert,
  //   Searches = app.models.searchLog;

  // async.parallelLimit([
  //   Chats.count.bind(Chats),
  //   Users.count.bind(Users),
  //   Adverts.count.bind(Adverts),
  //   Searches.count.bind(Searches),
  //   Users.find.bind(Users, {limit: 5, order: 'createdAt DESC'}),
  //   Adverts.find.bind(Adverts, {limit: 5, include: 'user', order: 'createdAt DESC'}),
  // ], 3, function(err, results) {
  //   if (err) {
  //     return res.error(err);
  //   }

  //   let totalRequests = results[0],
  //     totalUsers = results[1],
  //     totalMessages = results[2],
  //     totalSearches = results[3],
  //     users = results[4],
  //     adverts = results[5];

  res.render('dashboard', _.defaults(utils.getRequestVariables(app, req), {
    dashboardActive: 'active',
    pageName: 'Dashboard',
    totalMessages: 0,
    totalRequests: 0,
    // totalSearches: 0,
    // totalUsers: 0,
    latestUsers: [],
    latestAdverts: [],
  }));
  // });
});

module.exports = router;
