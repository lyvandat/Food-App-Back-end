const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: "Product",
    required: [true, "an item should have productId"],
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be greater than 1"],
  },
});

const CartSchema = new Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    items: [ItemSchema],
  },
  {
    timestamps: true,
  }
);

//update subTotal when changing the number of products in cart
CartSchema.pre("save", function (next) {
  if (!this.isModified("items")) return next();

  if (this.items.length === 0) return next();
  this.subTotal = this.items.reduce((accumulator, prod) => {
    return (accumulator += prod.total);
  }, 0);
  next();
});

CartSchema.methods.addItemToCart = async function (productId, quantity, price) {
  try {
    let productItemIndex = this.items.findIndex((prod) => {
      // parse ObjectId to String
      return String(prod.productId) === productId;
    });
    let newUpdatedItem = null;
    // if item exists
    if (productItemIndex !== -1) {
      newUpdatedItem = this.items[productItemIndex];
      newUpdatedItem.quantity += quantity;
      newUpdatedItem.total = newUpdatedItem.quantity * price;
      this.subTotal += newUpdatedItem.total;
      this.items[productItemIndex] = newUpdatedItem;
    }
    // if item does not exist
    else {
      newUpdatedItem = { productId, quantity, total: price * quantity };
      this.subTotal += newUpdatedItem.total;
      this.items.push(newUpdatedItem);
    }

    const newCart = await this.save();
    return newCart;
  } catch (err) {
    console.log(err);
    return null;
  }
};

CartSchema.methods.setItemCart = async function (productId, quantity, price) {
  try {
    let productItemIndex = this.items.findIndex((prod) => {
      // parse ObjectId to String
      return String(prod.productId) === productId;
    });
    let newUpdatedItem = null;
    // if item exists
    if (productItemIndex !== -1) {
      newUpdatedItem = this.items[productItemIndex];
      this.subTotal -= newUpdatedItem.total;
      newUpdatedItem.quantity = quantity;
      newUpdatedItem.total = newUpdatedItem.quantity * price;
      this.subTotal += newUpdatedItem.total;
      this.items[productItemIndex] = newUpdatedItem;

      // save cart
      const newCart = await this.save();
      return newCart;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
};

CartSchema.methods.removeItemFromCart = async function (
  productId,
  quantity,
  price
) {
  try {
    let productItemIndex = this.items.findIndex(
      (prod) => String(prod.productId) === productId
    );
    let newUpdatedItem = null;
    // if item exists
    if (productItemIndex !== -1) {
      newUpdatedItem = this.items[productItemIndex];
      newUpdatedItem.quantity -= quantity;
      newUpdatedItem.total -= quantity * price;
      this.items[productItemIndex] = newUpdatedItem;
    }

    // nếu số lượng cập nhật lại <= 0 thì xóa khỏi products
    if (newUpdatedItem?.quantity <= 0) {
      this.items = this.items.shift(productItemIndex, 1);
    }

    const newCart = await this.save();
    return newCart;
  } catch (err) {
    console.log(err.message);
    return null;
  }
};

CartSchema.methods.getPopulatedCart = async function () {
  // populate product data in productId field
  const cartPopulatedPromises = this.items.map(async (item, index) => {
    return this.populate(`items.${index}.productId`);
  });

  // [{}, {}, {}]: array of carts populated with product data
  const carts = await Promise.all(cartPopulatedPromises);
  return carts[0];
};

module.exports = mongoose.model("Cart", CartSchema);
