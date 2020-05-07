function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      var base64 = e.target.result;
      $("#image_preview").attr("src", base64);
      $("input[name=imagebase64]").val(base64);
    };

    reader.readAsDataURL(input.files[0]); // convert to base64 string
    
  }
}