const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AdminUserSchema = new Schema({
  username: { type: String, required: true, min: 4, unique: true },
  password: { type: String, required: true },
});

const AdminUserModel = model("AdminUser", AdminUserSchema);

module.exports = AdminUserModel;
