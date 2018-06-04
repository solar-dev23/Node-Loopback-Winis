'use strict';

let express = require('express');
let router = express.Router();

router.get('/health', function(req, res, next) {
  res.send('OK');
  return next();
});

module.exports = router;
