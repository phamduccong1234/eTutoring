var socketio = require("socket.io");
var io = socketio();
var socketApi = {};
var Messenger = require("./model/messenger");
var User = require("./model/user");
var Metting = require("./model/Metting");
var mongoose = require("mongoose");

socketApi.io = io;

io.on("connection", function (socket) {
  socket.broadcast.emit("message", "A user has joined the chat");
  console.log("connected");

  socket.on("disconnect", () => {
    io.emit("message", "A user has left the chat");
  });

  socket.on("sendMessage", (msg) => {
    io.emit("receiverMessage", msg);
  });

  socket.on("join", (id) => {
    console.log("join: " + id);
    socket.join(id);
  });

  socket.on("chat", async (message) => {
    var fromId = message.fromId;
    var toId = message.toId;
    var content = message.content;
    var messenger = await getMessenger(fromId, toId);
    await saveMessenger(messenger, getMessage(message));
    io.to(fromId).emit("sendMessage", message);
    io.to(toId).emit("receiveMessage", message);
  });

  socket.on("typing", (data) => {
    io.to(data.toId).emit("showTyping", data);
  });

  socket.on("sendMessage", (msg) => {
    io.emit("receiverMessage", msg);
  });

  socket.on("sendComment", async (data) => {
    var comment = data.comment;
    var _id = data._id;
    var metting = await getMettingById(_id);
    comment._id = getDefaultId();
    comment.created_at = new Date().toISOString();
    if (metting.isBlocked) {
      io.to(_id).emit("receiverComment", {
        isBlocked: metting.isBlocked,
        message: "This metting room has been blocked. You can't comment!",
      });
    } else {
      saveComment(metting, comment);
      io.to(_id).emit("receiverComment", {
        isBlocked: false,
        comment: comment,
      });
    }
  });


  socket.on("sendDocument", async (data) => {
    var document = data.document;
    var _id = data._id;
    var metting = await getMettingById(_id);
    document._id = getDefaultId();
    document.created_at = new Date().toISOString();
    if (metting.isBlocked) {
      io.to(_id).emit("receiverDocument", {
        isBlocked: metting.isBlocked,
        message: "This metting room has been blocked. You can't comment!",
      });
    } else {
      saveDocument(metting, document);
      io.to(_id).emit("receiverDocument", {
        isBlocked: false,
        message: "Upload file success!",
        document: document,
        index_document: metting.documents.length
      });
    }
  });

});

async function getMettingById(id) {
  return await Metting.findById(id);
}

async function saveComment(metting, comment) {
  metting.comments.push(comment);
  return await metting.save();
}

async function saveDocument(metting, document) {
  metting.documents.push(document);
  // metting.documents = [document];
  return await metting.save();
}

function getDefaultId() {
  return new Metting()._id;
}

function getMessage(message) {
  message.create_at = Date.now();
  return message;
}

async function getMessenger(studentId, tutorId) {
  var query = {
    $or: [
      {
        $and: [
          { "student._id": mongoose.Types.ObjectId(studentId) },
          { "tutor._id": mongoose.Types.ObjectId(tutorId) },
        ],
      },
      {
        $and: [
          { "student._id": mongoose.Types.ObjectId(tutorId) },
          { "tutor._id": mongoose.Types.ObjectId(studentId) },
        ],
      },
    ],
  };
  return await Messenger.findOne(query).exec();
}

async function saveMessenger(messenger, message) {
  messenger.messages.push(message);
  await messenger.save();
}

async function getUser(id) {
  return await User.findOne({ _id: id });
}

module.exports = socketApi;
