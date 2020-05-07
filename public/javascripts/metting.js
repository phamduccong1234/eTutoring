$(document).ready(() => {
  const socket = io();
  const momen = moment();
  const btnComment = $("#btn-comment");
  const commentForm = $("#comment-form");
  const comment = $("textarea[name=comment]");
  const documentName = $("textarea[name=document-name]");
  const btnDocument =  $("#btn-document");
  const documentbase64 = $("input[name=documentbase64]");

  function initActions() {
    btnComment.click(() => {
      console.log("asd");
      var comment = getComment();
      if ($.trim(comment).length != 0) {
        sendComment();
      }
    });
    btnDocument.click(()=>{
      sendDocument();
    })
  }

  $(window).on("keydown", function (e) {
    if (e.which == 13) {
      sendComment();
      return false;
    }
  });

  function joinSocketio() {
    socket.emit("join", _id);
  }

  function sendDocument(){
    var document = {
      src: getDocumentbase64(),
      name: getDocumentName(),
      size: file.size,
      type: file.type,
      nameFake: file.name,
      from: account,
    }
    socket.emit("sendDocument", { document, _id });
  } 

  function receiverDocument() {
    socket.on("receiverDocument", (data) => {
      if (data.isBlocked) {
        showNotification(data.message, "danger");
      } else {
        if(data.document.from._id == account._id){
          showNotification(data.message, "success");
        }
        resetDocument();
        disableDocumentButton();
        displayDocument(data.document, data.index_document);
      }
    });
  }

  function displayDocument(document, index_document) {
    console.log(document.src);
    var user = document.from;
    var fullname = user.firstname + " " + user.lastname;
    var image = user.imagebase64;
    if (image.length == 0) {
      image = "/images/orez.jpg";
    }
    $(
      '<tr>'
      +'  <td>'
      +     index_document
      +'  </td>'
      +'  <td>'
      +     document.name
      +'  </td>'
      +'  <td>'
      +'    <a class="nav-link" href="/metting">'
      +      document.from.firstname+" "+document.from.lastname
      +'    </a>'
      +'  </td>'
      +'  <td>'
      +'    <a class="nav-link" href="/document-download/'+_id+"/"+document._id+'">'
      +'      <i class="material-icons">cloud_download</i>'
      +'      Download'
      +'    </a>'
      +'  </td>'
      +'</tr>'
    ).appendTo($("#document-body"));
  }

  function sendComment() {
    var comment = {
      content: getComment(),
      from: account,
    };
    socket.emit("sendComment", { comment, _id });
  }

  function receiverComment() {
    socket.on("receiverComment", (data) => {
      if (data.isBlocked) {
        showNotification(data.message, "danger");
      } else {
        resetComment();
        displayComment(data.comment);
      }
    });
  }

  function getDocumentbase64(){
    return documentbase64.val();
  }

  function getDocumentName(){
    if($.trim(documentName.val()).length == 0){
      var index = file.name.lastIndexOf(".");
      return file.name.substring(0, index);
    }else{
      return documentName.val();
    }
  }

  function displayComment(comment) {
    var user = comment.from;
    var fullname = user.firstname + " " + user.lastname;
    var image = user.imagebase64;
    if (image.length == 0) {
      image = "/images/orez.jpg";
    }
    $(
      '<div class="card card-profile" style="text-align:' +
        'left; padding:5px 10px 5px 5px">' +
        '<div class="row">' +
        '  <div class="col-md-2">' +
        '    <div style="margin:0px; overflow:' +
        '      hidden; border-radius: 50%;height: 50px;width: 50px;">' +
        '      <a href="javascript:;">' +
        '        <img title="' +
        fullname +
        '" id="image_preview" style="width:100%"' +
        '          src="' +
        image +
        '" />' +
        "      </a>" +
        "    </div>" +
        "  </div>" +
        '  <div class="col-md-10">' +
        '    <a href="/">' +
        '      <h4 class="text-primary">' +
        fullname +
        "</h4>" +
        "    </a>" +
        '    <i class="d-inline">' +
        comment.content +
        "    </i>" +
        '    <p class="text-right">' +
        formatDatetime(comment.created_at) +
        "    </p>" +
        "  </div>" +
        "</div>" +
        "</div>"
    ).appendTo(commentForm);
    $(".message-input input").val(null);
  }

  function formatDatetime(datetime) {
    return moment(datetime).format("hh:mm A - MMMM DD, YYYY");
  }

  function getComment() {
    return comment.val();
  }

  function resetComment() {
    comment.val(null);
  }

  function resetDocument() {
    documentName.val(null);
  }

  function init() {
    joinSocketio();
    initActions();
    receiverComment();
    receiverDocument();
  }

  init();
});

//////////////////////////////////
