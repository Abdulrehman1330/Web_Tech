const mongoose = require("mongoose");
const productSchema = mongoose.Schema({
  name: String,
  price: String,
  type: String,
  description: String,
  image: String,
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
