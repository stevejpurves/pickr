
var Point = function(X, Y) {
    this.x = X;
    this.y = Y;
    this.equals = function(r) {
        return (this.x === r.x) && (this.y === r.y);
    }
    return this;
}

$(function() {
    var server = pickrAPIService(image_key);

    var orderedPointList = [];

    var pick_radius = pickDrawing.setup('image-div');

    pickDrawing.onPick(function(x1, y1) {
        var point = new Point(x1,y1);
        orderedPointList.push(point);
        pickDrawing.refresh(orderedPointList);
        server.update_pick(point)
    })

    $('#clear-button').click(function() {
        pickDrawing.clear();
        server.delete();
    });

    $('#undo-button').click(function() {
        orderedPointList.pop();
        pickDrawing.refresh(orderedPointList);
        server.remove_last_point();
    });
});
