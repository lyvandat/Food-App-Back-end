const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const CartModel = require("../models/Cart");

exports.getCart = catchAsync(async function (req, res, next) {
  let cart = await CartModel.findOne({ user: req.params.id });
  console.log("cart");
  console.log(cart);
  if (!cart) {
    cart = await CartModel.create({
      user: req.params.id,
      items: [],
    });
  } else {
    cart = await cart.getPopulatedCart();
  }

  res.status(200).json(cart);
});
