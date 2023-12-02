const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
  name: { type: String, required: true },
  briefDescription: { type: String, required: false },
  description: { type: String, required: true },
  additionalInformation: { type: String, required: false },
  price: { type: Number, required: false },
  mainImageUrl: { type: String, required: true },
  secondaryImageUrls: [{ type: String }],
  category: { type: String, required: false },
  stock: { type: Number, required: false },
  isOnSale: { type: Boolean, required: false },
  discount: { type: Number, required: false },
  createdAt: { type: Date, default: Date.now },
  colors: [{ type: String, required: false }],
  sizes: [{ type: String, required: false }],
  lightTone: { type: String, required: false },
  username: { type: String, required: false },
  measurements: [
    {
      measure: { type: String, required: false },
      price: { type: Number, required: false },
    },
  ],
});

module.exports = mongoose.model("Product", productSchema);
