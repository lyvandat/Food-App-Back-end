const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// const ItemSchema = new Schema(
//   {
//     productId: {
//       type: Schema.Types.ObjectId,
//       ref: "Product",
//       required: [true, "an item should have productId"],
//     },
//     quantity: {
//       type: Number,
//       required: true,
//       min: [1, "Quantity must be greater than 1"],
//     },
//     total: {
//       type: Number,
//       min: [0, "total price cannot be less than 0"],
//       default: 0,
//     },
//     note: {
//       type: String,
//       default: "Đang xử lí",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

const OrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    products: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: [true, "an item should have productId"],
      },
    ],

    subTotal: {
      type: Number,
      default: 0,
      min: [0, "total price cannot be less than 0"],
    },

    payment: {
      type: String,
      default: "cash",
      enum: {
        values: ["cash", "card"],
        message: "{VALUE} is not supported",
      },
    },

    shippingFee: {
      type: Number,
      default: 20000,
    },

    status: {
      type: String,
      default: "Đang xử lí",
    },

    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// OrderSchema.methods.getPopulatedOrder = async function () {
//   // populate product data in productId field
//   const orderPopulatedPromises = this.products.map(async (prod, index) => {
//     return this.populate(`products.${index}.productId`);
//   });

//   // [{}, {}, {}]: array of carts populated with product data
//   const orders = await Promise.all(orderPopulatedPromises);
//   return orders[0];
// };

OrderSchema.statics.getTotalSpent = async function (userId) {
  const orders = await this.find({ userId });

  const totalSpent = orders.reduce((accum, order) => {
    return accum + order.subTotal;
  });

  return totalSpent;
};

module.exports = mongoose.model("Order", OrderSchema);
