const app = require("./app");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
const port = 5000;

const db = require("./config/db");

// Connect to DB
db.connect();

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
