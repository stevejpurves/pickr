$(function() {
    var server = pickrAPIService(image_key);

    pickDrawing.setup('image-div');
    pickDrawing.onClick(function(p) {
        server.update_pick(p);
    });

    $('#clear-button').click(function() { 
        server.delete(function() { pickDrawing.clear(); })
    });

    $('#undo-button').click(function() {
        server.remove_last_point(function(p) { pickDrawing.removePoint({x: p[0], y: p[1]}); })
    });
});
