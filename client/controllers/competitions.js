'use strict';

let utils = require('../utils/utils');
let forms = require('forms');
let express = require('express');
let router = express.Router();
let formUtils = require('../utils/form');
let auth = require('../middlewares/auth');

router.get('/', auth, async function(req, res, next) {
  let app = req.app;
  let Competition = app.models.competition;

  const competitions = await Competition.find();

  const competitionData = competitions.map((competition)=>{
    return {
      id: competition.id,
      prize: competition.prize,
      startDate: competition.startDate,
      endDate: competition.endDate,
      image: competition.image,
      createdAt: competition.createdAt,
      updatedAt: competition.updatedAt,
    };
  });

  res.render('competitions', Object.assign(utils.getRequestVariables(app, req), {
    competitionsActive: 'active',
    pageName: 'Competition List',
    tableName: 'Competitions',
    competitions: competitionData,
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

router.post('/:id', auth, async function(req, res) {
  let app = req.app;
  let Deposits = app.models.deposit;
  let depositId = req.params.id;

  let depositForm = generateForm();

  depositForm.handle(req, {
    success: async function(form) {
      const deposit = await Deposits.findById(depositId);
      const updatedDeposit = await deposit.updateAttributes(form.data);
      res.render('deposits/view', Object.assign(utils.getRequestVariables(app, req), {
        depositsActive: 'active',
        pageName: 'deposit - Details',
        deposit: updatedDeposit,
        depositId: depositId,
        depositForm: depositForm.bind(updatedDeposit).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
    other: async function(form) {
      const deposit = await Deposits.findById(depositId);
      const updatedDeposit = await deposit.updateAttributes(form.data);
      res.render('deposits/view', Object.assign(utils.getRequestVariables(app, req), {
        depositsActive: 'active',
        pageName: 'deposit - Details',
        deposit: updatedDeposit,
        depositId: depositId,
        depositForm: depositForm.bind(updatedDeposit).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
    error: async function(form) {
      const deposit = await Deposits.findById(depositId);
      const updatedDeposit = await deposit.updateAttributes(form.data);
      res.render('deposits/view', Object.assign(utils.getRequestVariables(app, req), {
        depositsActive: 'active',
        pageName: 'deposit - Details',
        deposit: updatedDeposit,
        depositId: depositId,
        depositForm: depositForm.bind(updatedDeposit).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
  });
});

router.get('/:id/delete', auth, async function(req, res) {
  let app = req.app;
  let Deposits = app.models.deposit;
  let depositId = req.params.id;

  await Deposits.destroyById(depositId);

  res.render('deposits/delete', Object.assign(utils.getRequestVariables(app, req), {
    battlesActive: 'active',
    pageName: 'Battles',
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
