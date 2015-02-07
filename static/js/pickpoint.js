$(function() {
    var server = pickrAPIService(image_key);

    pickDrawing.setup('image-div');

    $('#image-div').click(function(e) {
        var imageX = e.pageX - this.offsetLeft;
        var imageY = e.pageY - this.offsetTop - 2;
        var point = pickDrawing.imagePositionToPoint(imageX, imageY);
        server.update_pick( point, function() { 
                pickDrawing.addPoint(point)
            });
    });
    
    $('#clear-button').click(function() { 
        server.delete(function() { pickDrawing.clear(); })
    });

    $('#undo-button').click(function() {
        server.remove_last_point(function(p) { pickDrawing.removePoint({x: p[0], y: p[1]}); })
    });
});
