var Point = function(X, Y) {
    this.x = X || 0;
    this.y = Y || 0;
    this.equals = function(r, tol) {
        if (!tol) tol = 0;
        return (Math.abs(this.x - r.x) <= tol)
            && (Math.abs(this.y - r.y) <= tol);
    };
    return this;
};

var PointList = function()
{
    var tol = 0;
    var points = [];
    var undo_stack = [];
    this.get_points = function(x) { return points; };
    this.add = function(x) {
                points.push(x);
                undo_stack.push(points.length-1);
            };
    this.remove_last = function() {
                points.splice(undo_stack[undo_stack.length-1], 1);
                undo_stack.pop();
            };
    this.clear = function() { points = []; };
    this.setTolerance = function(t) { tol = t; };
    this.insertAt = function(p, at) {
        points.splice(at+1, 0, p);
        undo_stack.push(at+1);
    };

    this.replace = function(p_old, p_new) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p_old, tol)) {
                points[i] = p_new;
                return true;
            }
        return false;
    };

    return this;
};

$(function() {
    var server = pickrAPIService(image_key);
    var pick_radius = pickDrawing.setup('image-div');
    
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
