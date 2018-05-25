'use strict';

let utils = require('../utils/utils');
let forms = require('forms');
let express = require('express');
let router = express.Router();
let formUtils = require('../utils/form');
let auth = require('../middlewares/auth');

router.get('/', auth, async function(req, res, next) {
  let app = req.app;
  let User = app.models.user;

  const users = await User.find();

  const userData = users.map((user)=>{
    return {
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      address: user.address,
      diamonds: user.diamonds,
      externalAuthMethod: user.externalAuthMethod,
      scratches: user.scratches,
      spins: user.spins,
      winis: user.winis,
      staked: user.staked,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    };
  });

  res.render('users', Object.assign(utils.getRequestVariables(app, req), {
    usersActive: 'active',
    pageName: 'User List',
    tableName: 'Users',
    users: userData,
  }));
});

router.get('/:id', auth, async function(req, res) {
  let app = req.app;
  let Users = app.models.user;
  let userId = req.params.id;

  let userForm = generateForm();

  const currentUser = await Users.findById(userId);
  res.render('users/view', Object.assign(utils.getRequestVariables(app, req), {
    usersActive: 'active',
    pageName: 'User - Details',
    user: currentUser,
    userId: userId,
    userForm: userForm.bind(currentUser).toHTML(formUtils.bootstrapField),
    resError: req.resError,
  }));
});

router.post('/:id', auth, async function(req, res) {
  let app = req.app;
  let Users = app.models.user;
  let userId = req.params.id;

  let userForm = generateForm();
  console.log('USERS _ POST');
  userForm.handle(req, {
    success: async function(form) {
      const user = await Users.findById(userId);
      const updatedUser = await user.updateAttributes(form.data);
      res.render('users/view', Object.assign(utils.getRequestVariables(app, req), {
        usersActive: 'active',
        pageName: 'User - Details',
        user: updatedUser,
        userId: userId,
        userForm: userForm.bind(updatedUser).toHTML(formUtils.bootstrapField),
      }));
    },
    other: async function(form) {
      const user = await Users.findById(userId);
      const updatedUser = await user.updateAttributes(form.data);
      res.render('users/view', Object.assign(utils.getRequestVariables(app, req), {
        usersActive: 'active',
        pageName: 'User - Details',
        user: updatedUser,
        userId: userId,
        userForm: userForm.bind(user).toHTML(formUtils.bootstrapField),
        resError: req.resError,
      }));
    },
    error: async function(form) {
      const user = await Users.findById(userId);
      const updatedUser = await user.updateAttributes(form.data);
      res.render('users/view', Object.assign(utils.getRequestVariables(app, req), {
        usersActive: 'active',
        pageName: 'User - Details',
        user: updatedUser,
        userId: userId,
        userForm: userForm.bind(updatedUser).toHTML(formUtils.bootstrapField),
      }));
    },
  });
});

router.get('/:id/delete', auth, async function(req, res) { 
  let app = req.app;
  let Users = app.models.user;
  let userId = req.params.id;

  await Users.destroyById(userId);
  res.render('users/delete', Object.assign(utils.getRequestVariables(app, req), {
    usersActive: 'active',
    pageName: 'Users',
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
    username: fields.string({
      required: true,
    }),
    phoneNumber: fields.number({
      required: true,
      widget: widgets.tel(),
    }),
    winis: fields.number({
      widget: widgets.number(),
    }),
    staked: fields.number({
      widget: widgets.number(),
    }),
    diamonds: fields.number({
      widget: widgets.number(),
    }),
    scratches: fields.number({
      widget: widgets.number(),
    }),
    spins: fields.number({
      widget: widgets.number(),
    }),
    isAdmin: fields.boolean({
      widget: widgets.checkbox(),
    }),
    adminLogin: fields.string({
      required: true,
    }),
    adminPassword: fields.string({
      required: true,
    }),
  });
}
module.exports = router;
