'use strict';

let express = require('express');
let router = express.Router();
let auth = require('../middlewares/auth');
let _ = require('lodash');
let utils = require('../utils/utils');

router.get('/', auth, function(req, res) {
//   let app = req.app;
//   let Searches = app.models.searchLog;

//   Searches.find({}, {order: 'createdAt DESC'}, function(err, data) {
//     if (err) {
//       return next(err);
//     }

//     if (data.length == 0) {
//       return next(['Empty'], [{'Empty': 'The table is empty :('}], param);
//     }

//     let searchMarkers = [];

//     let tableData = _.map(data, function(search) {
//       let searchMarker = {
//         title: search.id,
//         location: [search.location.lat, search.location.lng],
//       };
//       searchMarkers.push(searchMarker);

//       let userName = search.user.name;
//       if (_.isEmpty(userName)) {
//         userName = 'Inactive user';
//       }

//       return {
//         id: search.id,
//         user: userName,
//         location: search.location.lat + ',' + search.location.lng,
//         tags: search.tags,
//         matched: search.matched,
//         createdAt: search.createdAt,
//       };
//     });

//     let keys = [
//       'ID', 'User', 'Location', 'Address', 'Tags', 'Matched', 'Created',
//     ];

//     res.render('searches', _.defaults(utils.getRequestVariables(app, req), {
//       searchesActive: 'active',
//       pageName: 'Searches View',
//       tableName: 'Searches Logs',
//       _keys: keys,
//       _data: tableData,
//       _markers: searchMarkers,
//     }));
//   });
});

module.exports = router;
