'use strict';

let _ = require('lodash');
let utils = require('../utils/utils');
// let forms = require('forms');
let express = require('express');
let router = express.Router();
// let moment = require('moment');
// let formUtils = require('../utils/form');
let auth = require('../middlewares/auth');

router.get('/', auth, async function(req, res, next) {
  let app = req.app;
  let Deposit = app.models.deposit;

  const deposits = await Deposit.find();

  const depositData = deposits.map((deposit)=>{
    return {
      id: deposit.id,
      externalId: deposit.externalId,
      amount: deposit.amount,
      userId: deposit.userId,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
    };
  });

  res.render('deposits', _.defaults(utils.getRequestVariables(app, req), {
    usersActive: 'active',
    pageName: 'Deposit List',
    tableName: 'Deposits',
    deposits: depositData,
  }));
});

module.exports = router;
