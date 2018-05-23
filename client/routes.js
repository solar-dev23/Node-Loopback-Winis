'use strict';

let express = require('express');
let router = express.Router();

router.use('/account', require('./controllers/account')); // login window
router.use('/battles', require('./controllers/battles')); // TODO
router.use('/chats', require('./controllers/chats')); // TODO
router.use('/', require('./controllers/dashboard')); // main dashboadr
router.use('/deposits', require('./controllers/deposits')); // TODO
router.use('/_ah', require('./controllers/tools')); // heartbeat
router.use('/transactionLogs', require('./controllers/transactionLog')); // transaction log
router.use('/users', require('./controllers/users')); // users table

// router.use('/debug', require('./controllers/debug')); // change to transaction log
// router.use('/searches', require('./controllers/searches')); // WTF is this

module.exports = router;
