var mongoose = require("mongoose");
var schema = new mongoose.Schema(
  {
    student: Object,
    tutor: Object,
    isBlocked: {
        type: Boolean,
        default: false
    },
    messages: [Object],
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

module.exports = mongoose.model("messenger", schema);
