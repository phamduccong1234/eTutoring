var mongoose = require("mongoose");
var schema = new mongoose.Schema(
  {
    title: String,
    description: String,
    members: [Object],
    awaiting_approval: [Object],
    creator: Object,
    comments: [Object],
    documents: [Object],
    tasks: [Object],
    mode: String,
    isBlocked: {
        type: Boolean,
        default: false
    },
    imagebase64: String,
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

module.exports = mongoose.model("metting", schema);
