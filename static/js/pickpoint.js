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

var UndoStack = function()
{
    var the_stack = [];
    this.action = { ADD: 'add', MOVE: 'move' };
    this.push = function(a, idx, old_p) {
        the_stack.push( {action: a, idx: idx, old_point: old_p} )
    }
    this.pop = function()
    {
        var popped = the_stack[the_stack.length-1];
        the_stack.pop();
        return popped;
    }
    return this;
}

var PointList = function()
{
    var tol = 0;
    var points = [];
    var undo_stack = new UndoStack();
    this.get_points = function(x) { return points; };
    this.add = function(x) {
                points.push(x);
                undo_stack.push(undo_stack.action.ADD, points.length-1);
            };
    this.remove_last = function() {
                var last = undo_stack.pop();
                if (last.action === undo_stack.action.MOVE)
                    points[last.idx] = last.old_point;
                else
                    points.splice(last.idx, 1);
            };
    this.clear = function() { points = []; };
    this.setTolerance = function(t) { tol = t; };
    this.insertAt = function(p, at) {
        points.splice(at+1, 0, p);
        undo_stack.push(undo_stack.action.ADD, at+1);
    };
    this.replace = function(p_old, p_new) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p_old, tol)) {
                undo_stack.push(undo_stack.action.MOVE, i, points[i])
                points[i] = p_new;
                return true;
            }
        return false;
    };

    return this;
};

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
