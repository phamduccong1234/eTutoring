var mongoose = require("mongoose");
var schema = new mongoose.Schema(
  {
    tutor: Object,
    students: [Object],
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
  }
);

module.exports = mongoose.model("allocates", schema);
