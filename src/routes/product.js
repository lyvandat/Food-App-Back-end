var express = require("express");
var router = express.Router();

const {
  getItems,
  getItemDetail,
  updateItemQuantity,
  updateSelectFieldToItem,
  deleteItem,
  uploadTourImages,
  resizeUploadImages,
  createNewProduct,
  deleteProduct,
} = require("../app/controllers/ProductController");

const { protect, restrictTo } = require("../app/controllers/UserController");

router.delete("/:id/delete", [protect, deleteProduct]);

router
  .route("/:slug")
  .get(getItemDetail)
  .patch([protect, updateItemQuantity])
  .delete([protect, deleteItem]);
router
  .route("/")
  .get(getItems)
  .patch([protect, updateSelectFieldToItem])
  .post([
    protect,
    restrictTo(-1),
    uploadTourImages,
    resizeUploadImages,
    createNewProduct,
  ]);

module.exports = router;
