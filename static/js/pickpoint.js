$(function() {
  // Handler for .ready() called.
  $('#seismic-image').click(function(e) {
    var imageX = e.pageX - this.offsetLeft;
    var imageY = e.pageY - this.offsetTop;
    $.post('/update_pick', { x: imageX, y: imageY });
    //alert( "Handler for .click() called." + mouseX + "," + mouseY );
    });
});
