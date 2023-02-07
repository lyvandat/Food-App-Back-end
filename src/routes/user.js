var express = require("express");
var router = express.Router();

const {
  getUsers,
  createUser,
  updateMe,
  updatePassword,
  protect,
  restrictTo,
  createJwt,
  toSeller,
} = require("../app/controllers/UserController");

router.patch("/:id/to-seller", toSeller);

// register
router.post("/create", createUser);
router.post("/create-jwt", createJwt);

router.post('/create', createUser);
router.get('/', getUsers);


module.exports = router;
