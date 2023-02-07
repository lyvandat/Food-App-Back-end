var express = require('express');
var router = express.Router();

const {
  banUser,
  unbanUser,
} = require('../app/controllers/UserController');

router.patch('/ban/:id', banUser);
router.patch('/unban/:id', unbanUser);


module.exports = router;