const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
// parsing cookies
const cookieParser = require("cookie-parser");

const route = require("./routes");

app.use(express.static(path.join(__dirname, "public")));

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const corsOptions = { origin: false };
app.use(cors(corsOptions));
// HTTP logger
// app.use(morgan('combined'));

// Routes init

// app.use(function (req, res, next) {
//   res.header("Content-Type", "application/json;charset=UTF-8");
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://food-market.onrender.com");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Cookie"
  );
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH");
  next();
});
route(app);

module.exports = app;
