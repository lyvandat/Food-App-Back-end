const UserModel = require("../models/User");
const CartModel = require("../models/Cart");
const jwt = require("jsonwebtoken");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { promisify } = require("util");

const signToken = (userId) => {
  console.log(userId);
  console.log(process.env.JWT_SECRET);
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.createJwt = (req, res, next) => {
  const user = req.body;
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const createSendToken = (user, req, res, redirect = false) => {
  //   res.header("Access-Control-Allow-Credentials", true);
  // 1) create token
  const token = signToken(user._id);

  // 2) add token to cookies
  const cookieOptions = {
    // milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions["secure"] = true;
    cookieOptions["sameSite"] = "None";
  }

  res.cookie("jwt", token, cookieOptions);

  // 3) send res through api
  if (!redirect) {
    res.status(200).json({
      status: "success",
      token,
      data: {
        user,
      },
    });
  } else {
    res.redirect("/");
  }
};

exports.updateMe = catchAsync(async function (req, res, next) {
  const { username } = req.body;

  if (!username || username.length === 0) {
    return next(new AppError(400, "vui lòng nhập username"));
  }

  // khong co new: true thì trả về đối tượng cũ chưa update
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user._id,
    { usn: username },
    {
      new: true,
      // chỉ validate các fields được update
      runValidators: true,
    }
  );

  // remove password field from res data
  updatedUser.psw = undefined;

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.updatePassword = catchAsync(async function (req, res, next) {
  const { password, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return next(
      new AppError(400, "new password and confirm password are not the same")
    );
  }

  const user = await UserModel.findById(req.user._id);
  if (!user) {
    return next(new AppError(400, "Không thấy tài khoản để update"));
  }

  if (user.psw !== password) {
    return next(new AppError(400, "Mật khẩu hiện tại không đúng"));
  }

  // khong co new: true thì trả về đối tượng cũ chưa update
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user._id,
    { psw: newPassword },
    {
      new: true,
      // chỉ validate các fields được update
      runValidators: true,
    }
  );

  // remove password field from res data
  updatedUser.psw = undefined;

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.getUsers = catchAsync(async function (req, res, next) {
  const sortQuery = req.query.sort;
  const sortOptions = {};

  if (sortQuery) {
    const option_list = sortQuery.split("-");
    const sortOrder = option_list.includes("des") ? -1 : 1;

    option_list.forEach((option) => {
      if (option && option !== "des") sortOptions[option] = sortOrder;
    });
  }

  try {
    const user = await UserModel.find({}).sort(sortOptions);

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// usn: input_list.usn_input.val(),
// psw: input_list.psw_input.val(),
// status: STATUS.NORMAL,
// type: TYPE.NORMAL_USER,
exports.createUser = catchAsync(async function (req, res, next) {
  // const allowUserType = ["buyer", "admin", "seller"];

  const { usn, psw, status, type } = req.body;

  if (!usn || usn.trim().length === 0 || !psw || psw.length < 6) {
    return next(new AppError(400, "Invalid username and password"));
  }

  // 2) check if email has existed
  const user = await UserModel.findOne({ usn });

  if (user) {
    return next(
      new AppError(
        400,
        "Username has already existed, please try another email"
      )
    );
  }

  // 3) store user
  const storedUser = await UserModel.create({
    usn,
    psw,
    type,
  });

  // 3.1) create cart
  const cart = await CartModel.create({
    user: storedUser._id,
    items: [],
  });

  console.log("send token");
  // 4) send back to client
  createSendToken(storedUser, req, res);
});

exports.signOut = catchAsync(async (req, res, next) => {
  const cookieOptions = {
    // expires in 10 mins
    expires: new Date(Date.now() + 10 * 60 * 1000),
    httpOnly: true,
  };

  res.cookie("jwt", "loggedout", cookieOptions);

  res.status(200).json({
    status: "success",
    message: "logout successfully",
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // log in with gg
  console.log(req.cookies);
  let userLoggedIn = null;
  if (req.user) {
    // res.locals.quantity = cartQuantity;
    userLoggedIn = req.user;
  } else {
    try {
      // 1) check if user has signed in
      let token = null;
      const jsontoken = req.headers.authorization;
      if (jsontoken && jsontoken.startsWith("Bearer")) {
        token = jsontoken.split(" ")[1];
      } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
      }

      // throw error if token is not valid
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      // 2) check if user has been deleted
      const user = await UserModel.findOne({ _id: decoded.id });
      if (!user) {
        return next(new AppError(401, "You are not logged in!"));
      }

      req.user = user;
      userLoggedIn = user;
    } catch (err) {
      // console.log(err);
      return next(new AppError(500, err.message));
    }
  }

  // 4) user has logged in
  //global user for hbs view engine
  const cart = await CartModel.findOne({ user: userLoggedIn._id });
  let cartQuantity = 0;

  if (cart) {
    cartQuantity = cart.items.length;
  }

  // res.locals.cartQuantity = cartQuantity;
  res.locals.user = userLoggedIn;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  // log in with gg
  let userLoggedIn = null;
  if (req.user) {
    // res.locals.quantity = cartQuantity;
    userLoggedIn = req.user;
  } else {
    try {
      // 1) check if user has signed in
      let token = null;
      const jsontoken = req.headers.authorization;
      if (jsontoken && jsontoken.startsWith("Bearer")) {
        token = jsontoken.split(" ")[1];
      } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
      }

      // throw error if token is not valid
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      // 2) check if user has been deleted
      const user = await UserModel.findOne({ _id: decoded.id });
      if (!user) {
        return next();
      }

      // 3) check if user changes password after token has been signed
      const isChangedPassword = user.changePasswordAfter(decoded.iat);

      if (isChangedPassword) {
        return next();
      }
      req.user = user;

      userLoggedIn = user;
    } catch (err) {
      // console.log(err);
      return next();
    }
  }

  // 4) user has logged in
  //global user for hbs view engine
  const cart = await CartModel.findOne({ userId: userLoggedIn._id });
  let cartQuantity = 0;

  if (cart) {
    console.log("cart items length");
    console.log(cart.items);
    cartQuantity = cart.items.length;
  }

  // res.locals.cartQuantity = cartQuantity;
  res.locals.user = userLoggedIn;
  res.locals.quantity = cartQuantity;
  next();
};

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    // check if role is valid
    for (const role of roles) {
      if (![1, 0, -1].includes(role)) {
        return next(new AppError(400, "role is either user or admin"));
      }
    }

    if (!roles.includes(req.user.type)) {
      return next(
        new AppError(403, "you don't have right to perform this action")
      );
    }

    next();
  });
};

exports.banUser = catchAsync(async function (req, res, next) {
  try {
    const user = await UserModel.findByIdAndUpdate(req.params.id, {
      status: -1,
    });

    res.status(200).json({
      message: "success",
    });
  } catch (err) {
    return next(new AppError(404, "User not found or user is already banned"));
  }
});

exports.unbanUser = catchAsync(async function (req, res, next) {
  try {
    const user = await UserModel.findByIdAndUpdate(req.params.id, {
      status: 1,
    });

    res.status(200).json({
      message: "success",
    });
  } catch (err) {
    return next(
      new AppError(404, "User not found or user hasn't been banned yet")
    );
  }
});

exports.toSeller = catchAsync(async function (req, res, next) {
  try {
    const user = await UserModel.findByIdAndUpdate(req.params.id, { type: -1 });

    res.status(200).json({
      message: "success",
    });
  } catch (err) {
    return next(new AppError(404, "User not found"));
  }
});
