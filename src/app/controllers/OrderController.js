const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const OrderModel = require("../models/Order");
const CartModel = require("../models/Cart");
const UserModel = require("../models/User");
const ProductModel = require("../models/Product");
const { ObjectId } = require("mongodb");

exports.createOrder = catchAsync(async (req, res, next) => {
  const { name, phone, address, note, payment, products } = req.body;

  if (!name || !phone || !address || !note || !payment)
    return next(new AppError(400, "vui lòng nhập đủ thông tin mua hàng"));

  if (products.length === 0) {
    return next(new AppError(400, "Không có sản phẩm nào để đặt hàng"));
  }

  const cart = await CartModel.findOne({ user: req.user._id });
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    { phone, address, name },
    { new: true, runValidators: true }
  );

  if (!cart) {
    return next(new AppError(401, "cannot find your cart"));
  }

  if (!user) {
    return next(new AppError(401, "cannot find your account"));
  }

  // {
  //   "_id": "63adc81ac493595b660bf2f5",
  //   "key": "63adc81ac493595b660bf2f5",
  //   "name": "Nem Cuốn Chị Ngọc",
  //   "img": {
  //       "thumbnail": "dohan.png",
  //       "detail": "food_1.png"
  //   },
  //   "rating": 3.5,
  //   "rvcount": 1.286,
  //   "price": 56,
  //   "brand": "Sunrise Foods",
  //   "status": true,
  //   "slug": "nem-cuon-chi-ngoc",
  //   "quantity": 3
  // }
  // const products = [...cart.products].filter((prod) => {
  //   return prod.selected;
  // });

  //
  // const productSelectedPromises = products.map((prod) => {
  //   return ProductModel.findById(prod.productId);
  // });

  // sản phẩm tăng giá trị được mua khi người dùng đặt hàng
  // const productsUpdatedSpent = await Promise.all(productSelectedPromises);
  // const productsUpdatedSpentPromises = products.map((prod, index) => {
  //   productsUpdatedSpent[index]["total_purchase"] += prod.total;
  //   return productsUpdatedSpent[index].save();
  // });
  // await Promise.all(productsUpdatedSpentPromises);
  //

  const totalPrice = products.reduce((accumulator, prod) => {
    const totalPerProduct = prod.price * prod.quantity;
    return accumulator + totalPerProduct;
  }, 0);

  // update total spent for user
  if (user.total_spent) {
    user.total_spent += totalPrice + 20;
  }
  user.total_spent = totalPrice + 20;
  await user.save();
  //

  // create order
  const productIds = products.map((prod) => ObjectId(prod._id));
  const order = await OrderModel.create({
    userId: cart.user,
    products: productIds,
    subTotal: totalPrice + 20,
    note,
    payment,
  });

  res.json(201).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const order = await OrderModel.findByIdAndUpdate(orderId, req.body, {
    validateBeforeSave: true,
    new: true,
  });

  if (!order) {
    return next(new AppError(400, "cannot find order with that id"));
  }

  return res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.getOrders = catchAsync(async (req, res, next) => {
  let orders = await OrderModel.find({ userId: req.user._id }).populate(
    "products"
  );
  // const orderPromises = orders.map((order) => {
  //   return order.getPopulatedOrder();
  // });

  // // populated orders
  // orders = await Promise.all(orderPromises);
  res.status(200).json({
    status: "success",
    data: {
      orders,
    },
  });
});
