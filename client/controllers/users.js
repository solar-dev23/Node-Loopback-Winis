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

function generateForm() {
//   let fields = forms.fields;
//   let widgets = forms.widgets;

//   return forms.create({
//     name: fields.string({
//       required: true,
//     }),
//     address: fields.string({
//       required: false,
//     }),
//     email: fields.email({
//       required: true,
//       widget: widgets.email(),
//     }),
//     phoneNumber: fields.number({
//       required: true,
//       widget: widgets.tel(),
//     }),
//     deviceType: fields.string({
//       choices: {
//         ios: 'iOS',
//         android: 'Android',
//       },
//       widget: widgets.select(),
//     }),
//     useGps: fields.boolean({
//       widget: widgets.checkbox(),
//     }),
//     language: fields.string({
//       choices: {
//         en: 'English',
//         he: 'Hebrew',
//       },
//       widget: widgets.select(),
//     }),
//     admin: fields.boolean({
//       widget: widgets.checkbox(),
//     }),
//   });
}

function renderForm(res, req, formHTML, userId, user) {
//   let app = req.app;

//   let userMarker = {};
//   if (user) {
//     userMarker.title = user.name;

//     userMarker.lastUpdate = moment(user.updatedAt).fromNow();

//     if (user.location) {
//       userMarker.location = [
//         user.location.lat,
//         user.location.lng,
//       ];
//     }

//     if (user.address) {
//       userMarker.address = user.address;
//     }
//   }

//   res.render('users/view', Object.assign(utils.getRequestVariables(app, req), {
//     usersActive: 'active',
//     pageName: 'User - Details',
//     _user: user,
//     _userId: userId,
//     _userMarker: userMarker,
//     _userForm: formHTML,
//     _resError: req.resError,
//   }));
}

router.get('/:id', auth, function(req, res) {
//   let app = req.app;
//   let Users = app.models.user;
//   let userId = req.params.id;

//   let userForm = generateForm();

//   Users.findById(userId, function(err, user) {
//     if (err) {
//       return res.send(err);
//     }

//     renderForm(res, req, userForm.bind(user).toHTML(formUtils.bootstrapField), userId, user);
//   });
});

router.post('/:id', auth, function(req, res) {
//   let app = req.app;
//   let Users = app.models.user;
//   let userId = req.params.id;

//   let userForm = generateForm();

//   userForm.handle(req, {
//     success: function(form) {
//       Users.findById(userId, function(err, user) {
//         if (err) return cb('Couldn\'t find a user with ID ' + userId);

//         user.updateAttributes(form.data, function(err, user) {
//           if (err) return res.send(err);

//           renderForm(res, req, form.toHTML(formUtils.bootstrapField), userId, user);
//         });
//       });
//     },
//     other: function(form) {
//       renderForm(res, req, form.toHTML(formUtils.bootstrapField), userId);
//     },
//   });
});

router.get('/:id/delete', auth, function(req, res) {
//   let app = req.app;
//   let Users = app.models.user;
//   let userId = req.params.id;
//   const id = req.params.id;
//   Users.destroyById(userId, function(err) {
//     if (err) return res.send('Failed deleting user ' + id + ' because of ' + err);

//     return res.render('users/delete', Object.assign(utils.getRequestVariables(app, req), {
//       usersActive: 'active',
//       pageName: 'Users',
//     }));
//   });
});

router.get('/:id/installs', auth, function(req, res) {
  let app = req.app;
  let Users = app.models.user;
  let Installations = app.models.installation;

  Installations.find({where: {userId: req.params.id}}, function(err, data) {
    //     let installData = _.map(data, function(install) {
    //       let debugInstall = 'No';
    // FIX delete
    //       if (install.appId == 'rightnow-push-app-debug') {
    //         debugInstall = 'Yes';
    //       }

    //       return {
    //         id: install.id,
    //         createdAt: install.created,
    //         updatedAt: install.modified,
    //         device: install.deviceType,
    //         debug: debugInstall,
    //       };
    //     });

    //     res.render('users/installs', Object.assign(utils.getRequestVariables(app, req), {
    //       usersActive: 'active',
    //       pageName: 'User Installs',
    //       tableName: 'Installations',
    //       userId: req.params.id,
    //       _installs: installData,
    //     }));
  });
});

router.get('/:userId/installs/:pushId/push-test', auth, function(req, res) {
//   let app = req.app;
//   let PushModel = app.models.push;
//   let Notification = app.models.notification;
//   let userId = req.params.userId;
//   let pushId = req.params.pushId;

//   PushModel.on('error', function(err) {
//     console.error('Push Notification error: ', err.stack);
//   });

//   let note = new Notification({
//     badge: 10,
//     sound: 'ksahgdfkldb.caf',
//     alert: 'Test push notification from Winis backend',
//   });

//   let pushQuery = {};
//   if (pushId == 'all') {
//     pushQuery = {userId: userId};
//   } else {
//     pushQuery = {id: pushId};
//   }

//   PushModel.notifyByQuery(pushQuery, note, function(err) {
//     if (err) {
//       res.send('Cannot notify userId: ' + userId + ', install: ' + pushId + ', stack: <pre>' + err.stack + '</pre>');
//     }

//     res.send('pushing notification to userId: ' + userId + ', install: ' + pushId);
//   });
});

module.exports = router;
