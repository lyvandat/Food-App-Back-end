const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    usn: { type: String, required: true },
    psw: { type: String, required: true },
    name: { type: String },
    img: { type: String },
    status: { type: Number, default: 1 },
    type: { type: Number, default: 0 },
    rating: { type: Number },
    sales: { type: Number },
    rvcount: { type: Number },
    address: String,
    phone: String,
    total_spent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
