'use strict';

let utils = require('../utils/utils');
let forms = require('forms');
let express = require('express');
let router = express.Router();
let formUtils = require('../utils/form');
let auth = require('../middlewares/auth');

router.get('/', auth, async function(req, res, next) {
  let app = req.app;
  let Battle = app.models.battle;

  const battles = await Battle.find();

  const battleData = battles.map((battle)=>{
    return {
      id: battle.id,
      challengerId: battle.challengerId,
      opponentId: battle.opponentId,
      status: battle.status,
      game: battle.game,
      stake: battle.stake,
      challengerStatus: battle.challengerStatus,
      opponentStatus: battle.opponentStatus,
      result: battle.result,
      createdAt: battle.createdAt,
    };
  });
  console.log(battleData);
  
  res.render('battles', Object.assign(utils.getRequestVariables(app, req), {
    battlesActive: 'active',
    pageName: 'Battle List',
    tableName: 'Battles',
    battles: battleData,
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
