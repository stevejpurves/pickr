$(function() {
    var server = pickrAPIService(image_key);

    var pointList = [];

    pickDrawing.setup('image-div');
    pickDrawing.onClick(function(point) {
        pointList.push(point);
        pickDrawing.refresh(pointList);
        server.update_pick(point)
    })

    $('#clear-button').click(function() {
        pickDrawing.clear();
        server.delete();
    });

    $('#undo-button').click(function() {
        pointList.pop();
        pickDrawing.refresh(pointList);
        server.remove_last_point();
    });
});
