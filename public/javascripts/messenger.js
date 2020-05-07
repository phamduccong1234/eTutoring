$(document).ready(() => {
  const socket = io();
  setTimeout(function () {
    scrollToBottom();
  }, 3000);
  socket.emit("join", from_user._id);
  $(".submit").click(function () {
    sendMessage();
  });

  $(window).on("keydown", function (e) {
    if (e.which == 13) {
      sendMessage();
      return false;
    }
  });

  function sendMessage() {
    var content = $(".message-input input").val();
    if ($.trim(content) != "") {
      var messages = {
        fromId: getFromId(),
        toId: getToId(),
        content: content,
      };
      socket.emit("chat", messages);
    }
  }

  socket.on("sendMessage", (message) => {
    removeTyping();
    displayMessageFromMe(message.content);
    scrollToBottom();
  });

  socket.on("receiveMessage", (message) => {
    if (message.fromId == getToId()) {
      removeTyping();
      displayMessageFromOther(message.content);
    } else {
      displayPreview(message);
    }
    scrollToBottom();
  });

  function displayPreview(message) {
    $("#" + message.fromId + " .preview").html(
      "<span>" + getToName() + ": </span>" + message.content
    );
  }

  function getTextMessage() {
    return $(".message-input input").val();
  }

  function removeTyping() {
    $("#isTyping").remove();
  }

  function addTyping(name) {
    $(
      '<li id="isTyping" class="sent">' +
        "<p>" +
        name +
        " is typing ...</p>" +
        "</li>"
    ).appendTo($(".messages ul"));
  }

  $(".message-input input").focusin(() => {
    var message = getTextMessage();
    if ($.trim(message) != "") {
      checkTyping(true);
    } else {
      checkTyping(false);
    }
  });

  $(".message-input input").focusout(() => {
    checkTyping(false);
  });

  $(".message-input input").keyup(() => {
    var message = getTextMessage();
    if ($.trim(message) != "") {
      checkTyping(true);
    } else {
      checkTyping(false);
    }
  });

  function checkTyping(isTyping) {
    var data = {
      isTyping: isTyping,
      fromId: getFromId(),
      toId: getToId(),
    };
    socket.emit("typing", data);
  }

  socket.on("showTyping", (data) => {
    if (data.fromId == getToId()) {
      if (data.isTyping) {
        if ($("#isTyping").length == 0) {
          addTyping(getFromName());
        }
      } else {
        removeTyping();
      }
      scrollToBottom();
    }
  });
});

function getFromId() {
  return from_user._id;
}

function getToId() {
  return to_user._id;
}

function getFromName() {
  return from_user.firstname + " " + from_user.lastname;
}

function getToName() {
  return to_user.firstname + " " + to_user.lastname;
}

function getFromImage() {
  if (from_user.imagebase64.length == 0) {
    return "/images/orez.jpg";
  } else {
    return from_user.imagebase64;
  }
}

function getToImage() {
  if (to_user.imagebase64.length == 0) {
    return "/images/orez.jpg";
  } else {
    return to_user.imagebase64;
  }
}

function changeContact(e) {
  var parent = e.parentNode;
  var id = e.id;
  var mess = $("li.contact");
  for (let i = 0; i < mess.length; ++i) {
    if (mess[i].classList.contains("active")) {
      $("#" + mess[i].id).removeClass("active");
    }
  }
  $(e).addClass("active");
  var url = "messenger-detail/" + getFromId() + "/" + id;
  $.get(url, {}, (result) => {
    processData(result);
  });
}

function processData(result) {
  $(".messages ul").empty();
  if (result.student._id == getFromId()) {
    to_user = result.tutor;
  } else {
    to_user = result.student;
  }
  result.messages.forEach((message) => {
    if (message.fromId == getFromId()) {
      displayMessageFromMe(message.content);
    } else {
      displayMessageFromOther(message.content);
    }
  });
  $("#main-name").html(getToName());
  $("#main-avatar").attr('src',getToImage());
  scrollToBottom();
}

function displayMessageFromMe(message) {
  $(
    '<li class="replies"><img src="' +
      getFromImage() +
      '" alt="" style="min-height: 40px; min-width: 40px;" /><p>' +
      message +
      "</p></li>"
  ).appendTo($(".messages ul"));
  $(".message-input input").val(null);
  $(".contact.active .preview").html("<span>You: </span>" + message);
}

function displayMessageFromOther(message) {
  $(
    '<li class="sent"><img src="' +
      getToImage() +
      '" alt="" style="min-height: 40px; min-width: 40px;" /><p>' +
      message +
      "</p></li>"
  ).appendTo($(".messages ul"));
  $(".message-input input").val(null);
  $(".contact.active .preview").html(
    "<span>" + to_user.firstname + ": </span>" + message
  );
}

function scrollToBottom() {
  var numberItem = $("#list-messages").children().length;
  var heightEachItem = $("#list-messages").children().height();
  var height = numberItem * heightEachItem;
  $(".messages").animate({ scrollTop: height }, "fast");
}
