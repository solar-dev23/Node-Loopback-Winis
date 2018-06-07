'use strict';

let utils = require('../utils/utils');
let forms = require('forms');
let express = require('express');
let router = express.Router();
let moment = require('moment');
let formUtils = require('../utils/form');
let auth = require('../middlewares/auth');

router.get('/', auth, async function(req, res, next) {
  let app = req.app;
  let TransactionLog = app.models.transactionLog;

  const transactionLogs = await TransactionLog.find();

  const transactionLogsData = transactionLogs.map((transactionLog)=>{
    return {
      id: transactionLog.id,
      attribute: transactionLog.attribute,
      amount: transactionLog.amount,
      operationType: transactionLog.operationType,
      firstActor: transactionLog.firstActor,
      secondActor: transactionLog.secondActor,
      createdAt: transactionLog.createdAt,   
    };
  });
  
  res.render('transactionLogs', Object.assign(utils.getRequestVariables(app, req), {
    transactionLogActive: 'active',
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
    other: async function(form) {
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
    error: async function(form) {
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
  });
});

router.get('/:id/delete', auth, async function(req, res) {
  let app = req.app;
  let TransactionLogs = app.models.transactionLog;
  let transactionLogId = req.params.id;

  await TransactionLogs.destroyById(transactionLogId);
  res.render('transactionLogs/delete', Object.assign(utils.getRequestVariables(app, req), {
    transactionLogsActive: 'active',
    pageName: 'Transaction Log',
  }));
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
