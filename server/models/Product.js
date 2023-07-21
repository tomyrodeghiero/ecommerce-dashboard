const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
  name: { type: String, required: true },
  briefDescription: { type: String, required: true },
  description: { type: String, required: true },
  additionalInformation: { type: String, required: false },
  price: { type: Number, required: true },
  mainImageUrl: { type: String, required: true },
  secondaryImageUrls: [{ type: String }],
  category: { type: String, required: false },
  stock: { type: Number, required: false },
  isOnSale: { type: Boolean, required: false },
  discount: { type: Number, required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
