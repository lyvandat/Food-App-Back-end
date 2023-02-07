const express = require("express");

const router = express.Router();

const {
  updateOrder,
  createOrder,
  getOrders,
} = require("../app/controllers/OrderController");
const { protect, restrictTo } = require("../app/controllers/UserController");
router.route("/:id").patch([protect, restrictTo(1), updateOrder]);
router.route("/").post([protect, createOrder]).get([protect, getOrders]);
module.exports = router;
