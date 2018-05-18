'use strict';

let express = require('express');
let router = express.Router();
let auth = require('../middlewares/auth');
let _ = require('lodash');
let utils = require('../utils/utils');
let formUtils = require('../utils/form');
let forms = require('forms');

let generateForm = function() {
//   let fields = forms.fields;
//   let widgets = forms.widgets;

//   return forms.create({
//     name: fields.string({
//       required: true,
//     }),
//     type: fields.string({
//       choices: {
//         advert: 'Personal Ad',
//         business: 'Service Provider',
//       },
//       widget: widgets.select(),
//     }),
//     description: fields.string({
//       widget: widgets.textarea({
//         rows: 6,
//       }),
//       required: true,
//     }),
//     tags: formUtils.fields.tags({
//       widget: formUtils.widgets.tags({pattern: '^#'}),
//       validators: [formUtils.validators.tags()],
//       errorAfterField: true,
//     }),
//     price: fields.number(),
//     currency: fields.string({
//       choices: {
//         'ILS': 'ILS',
//         'EUR': 'EUR',
//         'USD': 'USD',
//       },
//       widget: widgets.select(),
//     }),
//     language: fields.string({
//       choices: {
//         en: 'English',
//         he: 'Hebrew',
//       },
//       widget: widgets.select(),
//     }),
//     useGps: fields.boolean({
//       widget: widgets.checkbox(),
//     }),
//     useAddress: fields.boolean({
//       widget: widgets.checkbox(),
//     }),
//     address: fields.string({
//       validators: [formUtils.validators.address()],
//     }),
//     email: fields.email({
//       required: true,
//       widget: widgets.email(),
//     }),
//     phone: fields.number({
//       required: true,
//       widget: widgets.tel(),
//     }),
//   });
};

let renderForm = function(res, req, formHTML, advertId, advert) {
//   let app = req.app;

//   let advertMarker = {};
//   if (advert) {
//     advertMarker.title = advert.name;

//     if (advert.location && advert.useGps) {
//       advertMarker.location = [
//         advert.location.lat,
//         advert.location.lng,
//       ];
//     }

//     if (advert.addressLocation && advert.useAddress) {
//       advertMarker.address = [
//         advert.addressLocation.lat,
//         advert.addressLocation.lng,
//       ];
//     }
//   }

//   res.render('adverts/view', _.defaults(utils.getRequestVariables(app, req), {
//     _adverts_active: 'active',
//     pageName: 'Advert - Details',
//     _advert: advert,
//     _advertId: advertId,
//     _advertMarker: advertMarker,
//     _advertForm: formHTML,
//     _resError: req.resError,
//   }));
};

router.get('/', auth, function(req, res) {
//   let app = req.app;
//   let Adverts = app.models.advert;
//   let searchKey = {};

//   if (!_.isEmpty(req.query.userId)) {
//     searchKey = {where: {userId: req.query.userId}};
//   }

//   Adverts.find(searchKey, {order: 'createdAt DESC'}, function(err, data) {
//     if (err) {
//       return next(err);
//     }

//     let advertMarkers = [];

//     let tableData = _.map(data, function(advert) {
//       let advertMarker = {
//         title: advert.name,
//       };

//       if (advert.location && advert.useGps) {
//         advertMarker.location = [
//           advert.location.lat,
//           advert.location.lng,
//         ];
//       }

//       if (advert.addressLocation && advert.useAddress) {
//         advertMarker.address = [
//           advert.addressLocation.lat,
//           advert.addressLocation.lng,
//         ];
//       }

//       advertMarkers.push(advertMarker);

//       let typeIcon;
//       if ('advert' == advert.type) {
//         typeIcon = '<i class="fa fa-thumb-tack" aria-hidden="true"></i> Advert';
//       } else {
//         typeIcon = '<i class="fa fa-globe" aria-hidden="true"></i> Business';
//       }

//       let language = 'English';
//       switch (advert.language) {
//         case 'he':
//           language = 'Hebrew';
//           break;
//       }

//       return {
//         id: advert.id,
//         type: typeIcon,
//         name: advert.name,
//         phone: advert.phone,
//         user: advert.user().name,
//         createdAt: advert.createdAt,
//       };
//     });

//     let keys = [
//       'ID', 'Type', 'Name', 'Phone', 'User', 'Created',
//     ];

//     res.render('adverts', _.defaults(utils.getRequestVariables(app, req), {
//       _adverts_active: 'active',
//       pageName: 'Adverts',
//       tableName: 'Adverts',
//       _keys: keys,
//       _data: tableData,
//       _markers: advertMarkers,
//     }));
//   });
});

router.get('/:id', auth, function(req, res) {
//   let app = req.app;
//   let Adverts = app.models.advert;
//   let advertId = req.params.id;

//   let advertForm = generateForm();

//   Adverts.findById(advertId, function(err, advert) {
//     if (err) {
//       res.send(err);
//     }

//     renderForm(res, req, advertForm.bind(advert).toHTML(formUtils.bootstrapField), advertId, advert);
//   });
});

router.post('/:id', auth, function(req, res) {
//   let app = req.app;
//   let Adverts = app.models.advert;
//   let advertId = req.params.id;

//   let advertForm = generateForm();

//   advertForm.handle(req, {
//     success: function(form) {
//       Adverts.findById(advertId, function(err, advert) {
//         if (err) {
//           return res.send('Couldn\'t find an advert with ID ' + advertId);
//         }

//         advert.updateAttributes(form.data, function(err, result) {
//           if (err) return res.send(err);
//           renderForm(res, req, form.toHTML(formUtils.bootstrapField), advertId, advert);
//         });
//       });
//     },
//     other: function(form) {
//       renderForm(res, req, form.toHTML(formUtils.bootstrapField), advertId);
//     },
//   });
});

router.get('/:id/delete', auth, function(req, res) {
//   let app = req.app;
//   let Adverts = app.models.advert;
//   let advertId = req.params.id;

//   Adverts.destroyById(advertId, function(err) {
//     if (err) return res.send('Failed deleting advert ' + id + ' because of ' + err);

//     return res.render('adverts/delete', _.defaults(utils.getRequestVariables(app, req), {
//       _adverts_active: 'active',
//       pageName: 'Adverts',
//     }));
//   });
});

module.exports = router;
