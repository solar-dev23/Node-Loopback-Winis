'use strict';

let utils = require('../utils/utils');
// let forms = require('forms');
let express = require('express');
let router = express.Router();
// let moment = require('moment');
// let formUtils = require('../utils/form');
let auth = require('../middlewares/auth');

router.get('/', auth, async function(req, res, next) {
  let app = req.app;
  let TransactionLog = app.models.transactionLog;

  const transactionLogs = await TransactionLog.find();

  const transactionLogsData = transactionLogs.map((transactionLog)=>{
    return transactionLog;
    // {
    //     "_id" : ObjectId("5a96cd7249e9505b59996036"),
    //     "attribute" : "winis",
    //     "amount" : 10,
    //     "operationType" : "release",
    //     "firstActor" : "5a4148c2e51b2d00018fb9e2",
    //     "secondActor" : "not_set",
    //     "createdAt" : ISODate("2018-02-28T15:40:34.979Z")
    // }
  });
  
  res.render('transactionLog', Object.assign(utils.getRequestVariables(app, req), {
    usersActive: 'active',
    pageName: 'Transaction List',
    tableName: 'Transactions',
    transactionLogs: transactionLogsData,
  }));
});

module.exports = router;
