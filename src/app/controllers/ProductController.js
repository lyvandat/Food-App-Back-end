const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const ProductModel = require("../models/Product");
const CartModel = require("../models/Cart");
const multer = require("multer");
const sharp = require("sharp");
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  // only support image files
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError(400, "only image files are supported"));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "photos", maxCount: 3 },
]);

exports.resizeUploadImages = catchAsync(async (req, res, next) => {
  if (!req.files["photos"] && !req.files["photo"]) {
    return next();
  }

  if (req.files["photo"]) {
    const foodThumbnailName = `food-${Math.ceil(
      Math.random() * 1000
    )}-${Date.now()}-cover.png`;
    req.body.photo = `/${foodThumbnailName}`;

    await sharp(req.files["photo"][0].buffer)
      .resize(610, 610)
      .toFormat("png")
      // start at root folder
      .toFile(`../Client/public/${req.body.photo}`);
  }

  next();
});

exports.getItems = async function (req, res, next) {
  try {
    const options = {};

    if (req.query.name) {
      options["name"] = req.query.name;
    }

    const product = await ProductModel.find(options);
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.getItemDetail = async function (req, res, next) {
  try {
    const product = await ProductModel.findOne({ slug: req.params.slug });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

// cart handler
exports.updateItemQuantity = catchAsync(async (req, res, next) => {
  // for logged-in user
  const cart = await CartModel.findOne({ user: req.user._id });
  const quantity = req.body.quantity || 0;
  const price = req.body.price || 0;
  const type = req.body.type || "add";
  const productId = req.body.productId;
  let newCart = null;

  if (!cart) {
    return next(new AppError(400, "cannot find cart with that userId"));
  }

  if (quantity === "" || isNaN(quantity) || quantity <= 0) {
    return next(new AppError(400, "invalid quantity value"));
  }

  if (type === "add") {
    newCart = await cart.addItemToCart(productId, quantity, price);
  } else {
    newCart = await cart.setItemCart(productId, quantity, price);
  }

  // res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.status(200).json({
    status: "success",
    data: {
      cart: newCart,
    },
  });
});

exports.updateSelectFieldToItem = catchAsync(async (req, res, next) => {
  const productIds = req.body.productIds;
  const cart = await CartModel.findOne({ userId: req.user._id });

  if (!productIds || productIds.length === 0) {
    return next(new AppError(400, "vui lòng chọn món ăn"));
  }

  cart.products.forEach((product, index) => {
    cart.products[index].selected = false;

    if (productIds.includes(String(product.productId))) {
      cart.products[index].selected = true;
    }
  });

  const newCart = await cart.save();
  res.status(200).json({
    status: "success",
    data: {
      cart: newCart,
    },
  });
});

exports.deleteItem = catchAsync(async (req, res, next) => {
  const cart = await CartModel.findOne({ userId: req.user._id });
  const productId = req.params.id;

  if (!cart) {
    return next(new AppError(400, "cannot find cart, cannot delete item"));
  }

  const deleteIndex = cart.products.findIndex(
    (product) => String(product.productId) === productId
  );

  if (deleteIndex === -1) {
    return next(new AppError(400, "cannot find item to delete"));
  }

  // update subtotal
  cart.subTotal -= cart.products[deleteIndex].total;
  // delete and save
  cart.products.splice(deleteIndex, 1);
  const newCart = await cart.save();

  res.status(200).json({
    status: "success",
    data: {
      cart: newCart,
    },
  });
});

exports.createNewProduct = catchAsync(async (req, res, next) => {
  const newFoodObj = {};

  const imgFields = [];
  Object.keys(req.body).forEach((element) => {
    if (!imgFields.includes(element)) {
      newFoodObj[element] = req.body[element];
    }
  });

  console.log(newFoodObj);

  const new_product = await ProductModel.create(newFoodObj);

  if (!new_product) {
    return next(new AppError(400, "Create product failed."));
  }

  res.status(200).json({
    message: "success",
    data: {
      new_product,
    },
  });
});

// cart

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const prod = await ProductModel.findByIdAndDelete(req.params.id);

  if (!prod) {
    return next(new AppError(400, "cannot find product"));
  }

  res.status(200).json({
    status: "success",
  });
});
