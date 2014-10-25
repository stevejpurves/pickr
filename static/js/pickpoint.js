$(function() {
    var seismicCanvas = $('#seismic-canvas');
    console.log(seismicCanvas);
    // Load image into canvas
    var context = seismicCanvas[0].getContext('2d');
    console.log(context);
    var base_image = new Image();
    base_image.src = '/static/data/Alaska.png';
    base_image.onload = function(){
        context.drawImage(base_image, 0, 0);
    };

  // Handler for .ready() called.
  seismicCanvas.click(function(e) {
    var imageX = e.pageX - this.offsetLeft;
    var imageY = e.pageY - this.offsetTop;
    $.post('/update_pick', { x: imageX, y: imageY }, 
        function(response){alert(response);});
//    alert( "Handler for .click() called." + imageX + "," + imageY );
    });
});
