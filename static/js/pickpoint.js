$(function() {
    var server = pickrAPIService(image_key);
    var pick_radius = pickDrawing.setup('image-div','picking');
    
    var the_list = new PointList();
    the_list.setTolerance(pick_radius);


    pickDrawing.onPick(function(p) {
        the_list.add(p);
        pickDrawing.refresh(the_list.get_points());
    });

    pickDrawing.onMove(function(end, start) {
        the_list.replace(start, end);
        pickDrawing.refresh(the_list.get_points());
    });

    pickDrawing.onInsert(function(p, at) {
        the_list.insertAt(p, at);
        pickDrawing.refresh(the_list.get_points());
    })

    $('#clear-button').click(function() {
        pickDrawing.clear();
        the_list.clear();
    });

    $('#undo-button').click(function() {
        the_list.remove_last();
        pickDrawing.refresh(the_list.get_points());
    });

    $('#submit-button').click(function() {
        server.send_picks(the_list.get_points(), function() {
            window.location.replace("/results?image_key=" + image_key);
        });
    });
});
