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
  let Deposit = app.models.deposit;

  const deposits = await Deposit.find();

  const depositData = deposits.map((deposit)=>{
    return {
      id: deposit.id,
      externalId: deposit.externalId,
      amount: deposit.amount,
      userId: deposit.userId,
      method: deposit.method,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
    };
  });

  res.render('deposits', Object.assign(utils.getRequestVariables(app, req), {
    depositsActive: 'active',
    pageName: 'Deposit List',
    tableName: 'Deposits',
    deposits: depositData,
  }));
});

router.get('/:id', auth, async function(req, res) {
  let app = req.app;
  let deposits = app.models.deposit;
  let depositId = req.params.id;

  let depositForm = generateForm();

  const currentDeposit = await deposits.findById(depositId);
  res.render('deposits/view', Object.assign(utils.getRequestVariables(app, req), {
    depositsActive: 'active',
    pageName: 'deposit - Details',
    deposit: currentDeposit,
    depositId: depositId,
    depositForm: depositForm.bind(currentDeposit).toHTML(formUtils.bootstrapField),
    resError: req.resError,
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
    externalId: fields.string({
      required: true,
    }),
    amount: fields.number({
      widget: widgets.number(),
    }),
    method: fields.string({
      required: true,
    }),
    userId: fields.string({
      required: true,
    }),
  });
}
module.exports = router;
