var express = require('express');
var router = express.Router();

const {
  home
} = require('../app/controllers/UserViewController');

router.get('/', home);

module.exports = router;
