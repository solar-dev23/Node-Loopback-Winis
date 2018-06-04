'use strict';

let express = require('express');
let router = express.Router();

// router.use('/account/login', require('./controllers/login'));
router.use('/', require('./controllers/dashboard'));
// router.use('/adverts', require('./controllers/adverts'));
// router.use('/searches', require('./controllers/searches'));
// router.use('/chats', require('./controllers/chats'));
// router.use('/users', require('./controllers/users'));
router.use('/account', require('./controllers/account'));
// router.use('/debug', require('./controllers/debug'));

// router.use('/_ah', require('./controllers/tools'));
// router.use(function(req, res, next){
//   res.redirect('/account/login');
// });

module.exports = router;
