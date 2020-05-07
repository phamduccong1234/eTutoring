var mongoose = require("mongoose");
var schema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      require: true,
    },
    lastname: {
      type: String,
      require: true,
    },
    address: String,
    city: String,
    country: String,
    phone: String,
    email: {
      type: String,
      require: true,
      unique: true,
    },
    username: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    aboutme: String,
    imagebase64: String,
    role: {
      type: String,
      default: "student",
    },
    created_at: {
      type: Date,
      required: false,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      required: false,
      default: Date.now,
    },
  },
  {
    collection: "users",
  }
);

module.exports = mongoose.model("users", schema);
