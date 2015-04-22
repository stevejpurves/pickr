$(function() {
    var server = pickrAPIService(image_key);
    var pick_radius = pickDrawing.setup('image-div','picking');
    
    var history = new PickHistory();
    var the_interpretation = new Interpretation(history);
    the_interpretation.setTolerance(pick_radius);

    function allowSubmitIfValidInterpretation(the_interpretation) {
        var num_points = the_interpretation.get_points().length
        if (((num_points >= 1) && (pickstyle=="points")) ||
            ((num_points >= 2) && (pickstyle=="lines")) ||
            ((num_points >= 3) && (pickstyle=="polygons"))) {
            $('#submit-button').removeAttr("disabled")
        }
        else
            $('#submit-button').attr("disabled", true)
    }

    pickDrawing.onPick(function(p) {
        the_interpretation.add(p);
        pickDrawing.refresh(the_interpretation.get_groups());
        allowSubmitIfValidInterpretation(the_interpretation);
    });

    pickDrawing.onMove(function(end, start) {
        the_interpretation.replace(start, end);
        pickDrawing.refresh(the_interpretation.get_groups());
    });

    pickDrawing.onInsert(function(p, after) {
        the_interpretation.insertAt(p, after);
        pickDrawing.refresh(the_interpretation.get_groups());
    })

    if (pickstyle === "points")
        $('#new-pick-button').prop('disabled',true)

    $('#new-pick-button').click(function() {
        the_interpretation.new_group()
        pickDrawing.refresh(the_interpretation.get_groups())
    })

    $('#clear-button').click(function() {
        pickDrawing.clear();
        the_interpretation.clear();
    });

    $('#undo-button').click(function() {
        history.undo(the_interpretation)
        pickDrawing.refresh(the_interpretation.get_groups());
    });

    $('#submit-button').click(function() {
        server.send_picks(the_interpretation.get_points(), history.raw(), function() {
            window.location.replace("/results?image_key=" + image_key);
        });
    });
});
