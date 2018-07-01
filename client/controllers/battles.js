'use strict';

const utils = require('../utils/utils');
const forms = require('forms');
const express = require('express');
const router = express.Router();
const formUtils = require('../utils/form');
const auth = require('../middlewares/auth');
const _ = require('lodash');

router.get('/', auth, async function(req, res, next) {
  let app = req.app;
  let Battle = app.models.battle;
  let searchKey = {};

  if (!_.isEmpty(req.query.userId)) {
    searchKey = {where: {or: [{opponentId: req.query.userId}, {challengerId: req.query.userId}]}};
  }

  const battles = await Battle.find(searchKey);

  res.render('battles', Object.assign(utils.getRequestVariables(app, req), {
    battlesActive: 'active',
    pageName: 'Battle List',
    tableName: 'Battles',
    battles: battles,
  }));
});

router.get('/:id', auth, async function(req, res) {
  let app = req.app;
  let battles = app.models.battle;
  let battleId = req.params.id;

  let battleForm = generateForm();

  const currentBattle = await battles.findById(battleId);
  res.render('battles/view', Object.assign(utils.getRequestVariables(app, req), {
    battlesActive: 'active',
    pageName: 'battle - Details',
    battle: currentBattle,
    battleId: battleId,
    battleForm: battleForm.bind(currentBattle).toHTML(formUtils.bootstrapField),
    resError: req.resError,
  }));
});

router.post('/:id', auth, async function(req, res) {
  let app = req.app;
  let battles = app.models.battle;
  let battleId = req.params.id;

  let battleForm = generateForm();

  battleForm.handle(req, {
    success: async function(form) {
      const battle = await battles.findById(battleId);
      const updatedBattle = await battle.updateAttributes(form.data);
      res.render('battles/view', Object.assign(utils.getRequestVariables(app, req), {
        battlesActive: 'active',
        pageName: 'battle - Details',
        battle: updatedBattle,
        battleId: battleId,
        battleForm: battleForm.bind(updatedBattle).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
    other: async function(form) {
      const battle = await battles.findById(battleId);
      const updatedBattle = await battle.updateAttributes(form.data);
      res.render('battles/view', Object.assign(utils.getRequestVariables(app, req), {
        battlesActive: 'active',
        pageName: 'battle - Details',
        battle: updatedBattle,
        battleId: battleId,
        battleForm: battleForm.bind(updatedBattle).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
    error: async function(form) {
      const battle = await battles.findById(battleId);
      const updatedBattle = await battle.updateAttributes(form.data);
      res.render('battles/view', Object.assign(utils.getRequestVariables(app, req), {
        battlesActive: 'active',
        pageName: 'battle - Details',
        battle: updatedBattle,
        battleId: battleId,
        battleForm: battleForm.bind(updatedBattle).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
  });
});

router.get('/:id/delete', auth, async function(req, res) {
  let app = req.app;
  let Battles = app.models.battle;
  let battleId = req.params.id;
  console.log('BATTLE deleting');
  const result = await Battles.destroyById(battleId);
  console.log(result);
  res.render('battles/delete', Object.assign(utils.getRequestVariables(app, req), {
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
    challengerId: fields.string({
      required: true,
    }),
    opponentId: fields.string({
      required: true,
    }),
    status: fields.string({
      choices: {
        pending: 'pending',
        accepted: 'accepted',
        rejected: 'rejected',
        finished: 'finished',
      },
      widget: widgets.select(),
    }),
    game: fields.string({
      required: true,
    }),
    stake: fields.number({
      widget: widgets.number(),
    }),
    challengerStatus: fields.string({
      choices: {
        notSet: 'not_set',
        won: 'won',
        lost: 'lost',
        draw: 'draw',
      },
      widget: widgets.select(),
    }),
    opponentStatus: fields.string({
      choices: {
        notSet: 'not_set',
        won: 'won',
        lost: 'lost',
        draw: 'draw',
      },
      widget: widgets.select(),
    }),
    result: fields.string({
      choices: {
        notSet: 'not_set',
        challengerWon: 'challenger won',
        opponentWon: 'opponent won',
        draw: 'both draw',
      },
      widget: widgets.select(),
    }),
  });
}

module.exports = router;
