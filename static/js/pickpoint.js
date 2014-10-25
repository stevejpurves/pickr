$(function() {
    var seismicCanvas = $('#seismic-canvas');
    var context = seismicCanvas[0].getContext('2d');

    // Load image into canvas
    var base_image = new Image();
    base_image.src = '/static/data/Alaska.png';
    base_image.onload = function(){
        context.drawImage(base_image, 0, 0);
    };
    
    var drawCircle = function(x, y)
    {
        context.beginPath();
        var radius = 10;
        context.arc(x, y, radius, 0, 2 * Math.PI, false);
        context.fillStyle = 'green';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = '#003300';
        context.stroke();
    }

    seismicCanvas.click(function(e) {
        var imageX = e.pageX - this.offsetLeft;
        var imageY = e.pageY - this.offsetTop;
        $.post('/update_pick', { x: imageX, y: imageY }, 
            function(response){
                drawCircle(imageX, imageY);});
    });
});
