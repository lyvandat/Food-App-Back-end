const globalErrorHandler = require("./errorHandler");
const siteRouter = require("./site");
const productRouter = require("./product");
const userRouter = require("./user");
const cartRouter = require("./cart");
const orderRouter = require("./order");
const adminRouter = require("./admin");

function route(app) {
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/orders", orderRouter);

  app.use("/", siteRouter);

  // global error handler
  app.use(globalErrorHandler);
}

module.exports = route;
