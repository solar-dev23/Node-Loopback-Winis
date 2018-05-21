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
  let Battle = app.models.battle;

  const battles = await Battle.find();

  const battleData = battles.map((battle)=>{
    return {
      challengerId: battle.challengerId,
      opponentId: battle.opponentId,
      status: battle.status,
      game: battle.game,
      stake: battle.stake,
      challengerStatus: battle.challengerStatus,
      opponentStatus: battle.opponentStatus,
      result: battle.result,
    };
  });
  
  res.render('battles', _.defaults(utils.getRequestVariables(app, req), {
    usersActive: 'active',
    pageName: 'Battle List',
    tableName: 'Battles',
    battles: battleData,
  }));
});

module.exports = router;
