'use strict';

let utils = require('../utils/utils');
let forms = require('forms');
let express = require('express');
let router = express.Router();
// let moment = require('moment');
let formUtils = require('../utils/form');
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
  
  res.render('transactionLogs', Object.assign(utils.getRequestVariables(app, req), {
    transactionLogsActive: 'active',
    pageName: 'Transaction List',
    tableName: 'Transactions',
    transactionLogs: transactionLogsData,
  }));
});

router.get('/:id', auth, async function(req, res) {
  let app = req.app;
  let TransactionLogs = app.models.transactionLog;
  let transactionLogId = req.params.id;

  let transactionLogForm = generateForm();

  const currentTransactionLog = await TransactionLogs.findById(transactionLogId);
  res.render('transactionLogs/view', Object.assign(utils.getRequestVariables(app, req), {
    transactionLogsActive: 'active',
    pageName: 'Transaction Log - Details',
    transactionLog: currentTransactionLog,
    transactionLogId: transactionLogId,
    transactionLogForm: transactionLogForm.bind(currentTransactionLog).toHTML(formUtils.bootstrapField),
    resError: req.resError,
  }));
});

router.post('/:id', auth, async function(req, res) {
  let app = req.app;
  let TransactionLogs = app.models.transactionLog;
  let transactionLogId = req.params.id;

  let transactionLogForm = generateForm();

  transactionLogForm.handle(req, {
    success: async function(form) {
      const transactionLog = await TransactionLogs.findById(transactionLogId);
      const updatedTransactionLog = await transactionLog.updateAttributes(form.data);
      res.render('transactionLogs/view', Object.assign(utils.getRequestVariables(app, req), {
        transactionLogsActive: 'active',
        pageName: 'Transaction Log - Details',
        transactionLog: updatedTransactionLog,
        transactionLogId: transactionLogId,
        transactionLogForm: transactionLogForm.bind(updatedTransactionLog).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
    other: function(form) {
      res.render('transactionLogs/view', Object.assign(utils.getRequestVariables(app, req), {
        transactionLogsActive: 'active',
        pageName: 'transactionLog - Details',
        // transactionLog: updatedtransactionLog,
        transactionLogId: transactionLogId,
        // transactionLogForm: transactionLogForm.bind(updatedtransactionLog).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
  });
});
/** 
* generate form
* @return {string}form configuration
*/
function generateForm() {
  let fields = forms.fields;
  let widgets = forms.widgets;

  return forms.create({
    attribute: fields.string({
      required: true,
    }),
    amount: fields.number({
      widget: widgets.number(),
    }),
    operationType: fields.string({
      required: true,
    }),
    firstActor: fields.string({
      required: true,
    }),
    secondActor: fields.string({
      required: true,
    }),
  });
}

module.exports = router;
