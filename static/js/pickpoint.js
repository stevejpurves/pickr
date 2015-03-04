$(function() {
    var server = pickrAPIService(image_key);
    var pick_radius = pickDrawing.setup('image-div','picking');
    
    var history = new PickHistory();
    var the_interpretation = new Interpretation(history);
    the_interpretation.setTolerance(pick_radius);

    pickDrawing.onPick(function(p) {
        the_interpretation.add(p);
        pickDrawing.refresh(the_interpretation.get_points());
    });

    pickDrawing.onMove(function(end, start) {
        the_interpretation.replace(start, end);
        pickDrawing.refresh(the_interpretation.get_points());
    });

    pickDrawing.onInsert(function(p, at) {
        the_interpretation.insertAt(p, at);
        pickDrawing.refresh(the_interpretation.get_points());
    })

    $('#clear-button').click(function() {
        pickDrawing.clear();
        the_interpretation.clear();
    });

    $('#undo-button').click(function() {
        history.undo(the_interpretation)
        pickDrawing.refresh(the_interpretation.get_points());
    });

    $('#submit-button').click(function() {
        server.send_picks(the_interpretation.get_points(), history.raw(), function() {
            window.location.replace("/results?image_key=" + image_key);
        });
    });
});
