'use strict';

let express = require('express');
let router = express.Router();
let auth = require('../middlewares/auth');
let async = require('async');
let debug = require('debug')('webadmin:chats');
let SendBird = require('../../common/services/SendBirdService');
let utils = require('../utils/utils');

router.get('/', auth, function(req, res) {
  let app = req.app;
  let Chats = app.models.chatLog;

//   Chats.find({'include': ['user', 'advert']}, function(err, data) {
//     let tableData = _.map(data, function(chat) {
//       let advert = chat.advert();
//       let user = chat.user();

//       if (_.isEmpty(advert) || _.isEmpty(user)) {
//         return {
//           id: chat.id,
//           advert: 'Inactive',
//           user: 'Inactive',
//           status: 'Inactive',
//           createdAt: chat.createdAt,
//           updatedAt: chat.updatedAt,
//         };
//       }

//       return {
//         id: chat.id,
//         advert: advert.name,
//         user: user.name,
//         status: chat.status,
//         createdAt: chat.createdAt,
//         updatedAt: chat.updatedAt,
//       };
//     });

//     let keys = _.keys(_.first(tableData));

//     res.render('chats', Object.assign(utils.getRequestVariables(app, req), {
//       _chats_active: 'active',
//       pageName: 'Chat Requests',
//       tableName: 'Chat Logs',
//       _keys: keys,
//       _data: tableData,
//     }));
//   });
});

router.get('/:id', auth, function(req, res) {
//   let app = req.app;
//   let Chat = app.models.chatLog;
//   let User = app.models.user;
//   let Advert = app.models.advert;
//   let chatId = req.params.id;

//   Chat.findById(chatId, {order: 'createdAt DESC'}, function(err, chat) {
//     if (err) {
//       return res.error(err);
//     }

//     async.parallel([
//       User.findById.bind(User, chat.userId),
//       User.findById.bind(User, chat.advertUserId),
//       Advert.findById.bind(Advert, chat.advertId),
//     ], function(err, results) {
//       let customerUser = results[0],
//         advertUser = results[1],
//         advert = results[2];

//       let sendBirdService = new SendBird();
//       sendBirdService.getMessages(chat.pushBody.channel.channel_url, function(err, messagesObj) {
//         messages = messagesObj.messages;

//         messages = _.map(messages, function(message) {
//           let data = {};

//           try {
//             data = JSON.parse(message.data);
//           } catch (e) {
//             debug(e);
//           }

//           if (!_.isEmpty(message.file)) {
//             let file = message.file;
//             let fileCategory = file.type.split('/');

//             message.file.category = fileCategory[0];
//           }

//           return Object.assign({
//             data: data,
//           }, message);
//         });

//         res.render('chats/view', Object.assign(utils.getRequestVariables(app, req), {
//           _customerUser: customerUser,
//           _advertUser: advertUser,
//           _advert: advert,
//           _chat: chat,
//           _messages: messages,
//         }));
//       });
//     });
//   });
});

module.exports = router;
