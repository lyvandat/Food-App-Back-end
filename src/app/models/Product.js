const mongoose = require("mongoose");
const slug = require("mongoose-slug-generator");

const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    img: {
      thumbnail: { type: String, default: "pho.png" },
      detail: { type: String, default: "food_3.png" },
    },
    rating: { type: Number, default: 0 },
    rvcount: { type: Number, default: 5 },
    price: { type: Number, required: true },
    brand: { type: String, default: "Sunrise Food" },
    status: { type: Boolean },

    slug: { type: String, slug: "name", unique: true },
    photo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
//Custom query helper
// ProductSchema.query.sortable = function (req) {
//     if (req.query.hasOwnProperty('_sort')) {
//         const isValidType = ['asc', 'desc'].includes(req.query.type);
//         return this.sort({
//             [req.query.column]: isValidType ? req.query.type : 'desc',
//         });
//     }
//     return this;
// };

// Add plugin
mongoose.plugin(slug);

module.exports = mongoose.model("Product", ProductSchema);
