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
  let competitions = app.models.competition;
  let competitionId = req.params.id;

  let competitionForm = generateForm();

  const currentCompetition = await competitions.findById(competitionId);
  res.render('competitions/view', Object.assign(utils.getRequestVariables(app, req), {
    competitionsActive: 'active',
    pageName: 'Competitions - Details',
    competition: currentCompetition,
    competitionId: competitionId,
    competitionForm: competitionForm.bind(currentCompetition).toHTML(formUtils.bootstrapField),
    resError: req.resError,
  }));
});

router.post('/:id', auth, async function(req, res) {
  let app = req.app;
  let Competitions = app.models.competition;
  let competitionId = req.params.id;

  let competitionForm = generateForm();

  competitionForm.handle(req, {
    success: async function(form) {
      const competition = await Competitions.findById(competitionId);
      const updatedCompetition = await competition.updateAttributes(form.data);
      res.render('competitions/view', Object.assign(utils.getRequestVariables(app, req), {
        competitionsActive: 'active',
        pageName: 'Competition - Details',
        competition: updatedCompetition,
        competitionId: competitionId,
        competitionForm: competitionForm.bind(updatedCompetition).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
    other: async function(form) {
      const competition = await Competitions.findById(competitionId);
      const updatedCompetition = await competition.updateAttributes(form.data);
      res.render('competitions/view', Object.assign(utils.getRequestVariables(app, req), {
        competitionsActive: 'active',
        pageName: 'Competition - Details',
        competition: updatedCompetition,
        competitionId: competitionId,
        competitionForm: competitionForm.bind(updatedCompetition).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
    error: async function(form) {
      const competition = await Competitions.findById(competitionId);
      const updatedCompetition = await competition.updateAttributes(form.data);
      res.render('competitions/view', Object.assign(utils.getRequestVariables(app, req), {
        competitionsActive: 'active',
        pageName: 'Competition - Details',
        competition: updatedCompetition,
        competitionId: competitionId,
        competitionForm: competitionForm.bind(updatedCompetition).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
  });
});

router.get('/:id/delete', auth, async function(req, res) {
  let app = req.app;
  let Competitions = app.models.competition;
  let competitionId = req.params.id;

  await Competitions.destroyById(competitionId);

  res.render('competitions/delete', Object.assign(utils.getRequestVariables(app, req), {
    competitionsActive: 'active',
    pageName: 'Competitions',
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
    prize: fields.string({
      required: true,
    }),
    image: fields.string({
      required: true,
    }),
    startDate: fields.date({
      widget: widgets.date(),
      required: true,
    }),
    endDate: fields.date({
      widget: widgets.date(),
      required: true,
    }),
  });
}
module.exports = router;
