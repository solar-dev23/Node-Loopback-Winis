'use strict';

let express = require('express');
let router = express.Router();

router.use('/account', require('./controllers/account'));
router.use('/battles', require('./controllers/battles')); 
router.use('/', require('./controllers/dashboard'));
router.use('/deposits', require('./controllers/deposits'));
router.use('/_ah', require('./controllers/tools')); 
router.use('/transactionLogs', require('./controllers/transactionLog'));
router.use('/users', require('./controllers/users'));

module.exports = router;
