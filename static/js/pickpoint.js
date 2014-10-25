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
    
    var points = [];
    
    var connectTheDots = function() // Lalalalala
    {
        context.beginPath();
        context.moveTo(points[0].x, points[1].x);
        points.forEach(function(p){
            context.lineTo(p.x, p.y);
        });
        context.stroke();
    }

    seismicCanvas.click(function(e) {
        var imageX = e.pageX - this.offsetLeft;
        var imageY = e.pageY - this.offsetTop;
        var point = { x: imageX, y: imageY };
        $.post('/update_pick', point, 
            function(response){
                points.push(point);
                drawCircle(imageX, imageY);
                connectTheDots();
            });
    });
});
