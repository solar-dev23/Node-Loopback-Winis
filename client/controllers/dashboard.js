'use strict';

let express = require('express');
let router = express.Router();
let auth = require('../middlewares/auth');

let utils = require('../utils/utils');

router.get('/', auth, async function(req, res) {
  let app = req.app;
  let Users = app.models.user;
  let Deposits = app.models.deposit;
  let Battles = app.models.battle;
  const totalUsers = await Users.count();
  const totalDeposits = await Deposits.count();
  const totalBattles = await Battles.count();

  res.render('dashboard', Object.assign(utils.getRequestVariables(app, req), {
    dashboardActive: 'active',
    pageName: 'Dashboard',
    totalUsers: totalUsers,
    totalDeposits: totalDeposits,
    totalBattles: totalBattles,
    latestUsers: [],
    latestAdverts: [],
  }));
});

module.exports = router;
