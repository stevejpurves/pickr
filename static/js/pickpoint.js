$(function() {
    var server = pickrAPIService();

    pickDrawing.setup('image-div');

    $('#image-div').click(function(e) {
        var imageX = e.pageX - this.offsetLeft;
        var imageY = e.pageY - this.offsetTop - 2;
        var point = { x: imageX, y: imageY };
        pickDrawing.clickPoint(point);
    });
    
    $('#clear-button').click(function() { 
        server.delete(function() { pickDrawing.clear(); })
    });

    $('#undo-button').click(function() {
        server.remove_last_point(function(p) { pickDrawing.removePoint({x: p[0], y: p[1]}); })
    });
});
