var Point = function(X, Y) {
    this.x = X || 0;
    this.y = Y || 0;
    this.equals = function(r, tol) {
        if (!tol) tol = 0
        return (Math.abs(this.x - r.x) <= tol) 
            && (Math.abs(this.y - r.y) <= tol);
    }
    return this;
}

var PointList = function()
{
    var tol = 0;
    var points = [];
    var undo_stack = [];
    this.get_points = function(x) { return points }
    this.add = function(x) {
                points.push(x)
                undo_stack.push(points.length-1)
            }
    this.remove_last = function() {
                points.splice(undo_stack[undo_stack.length-1], 1)
                undo_stack.pop()
            }
    this.clear = function() { points = [] }
    this.setTolerance = function(t) { tol = t }
    this.contains = function(p) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p, tol))
                return true;
        return false;
    }
    this.isIntersection = function(p) {
        for (var i = 0; i < points.length-1; i++) {
            if (this._colinear(points[i], points[i+1], p) &&
                this._inbounds(points[i], points[i+1], p)) {
                return true;
            }
        }
        return false;
    }
    this.insertAtIntersection = function(p) {
        for (var i = 0; i < points.length-1; i++) {
            if (this._colinear(points[i], points[i+1], p) &&
                this._inbounds(points[i], points[i+1], p)) {
                points.splice(i+1, 0, p)
                undo_stack.push(i+1)
                return true
            }
        }
    }
    this.replace = function(p_old, p_new) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p_old, tol)) {
                points[i] = p_new
                return true
            }
        return false
    }

    this._colinear = function(a, b, c) {
        var segment_length = Math.sqrt( Math.pow(a.x-b.x,2) + Math.pow(a.y-b.y,2) )
        var abs_xprod = Math.abs((c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y))
        return abs_xprod < (1.1 * segment_length)
    }

    this._inbounds = function(a, b, p) {
        var min = new Point()
        var max = new Point()

        if (a.x < b .x) {
            min.x = a.x;
            max.x = b.x;
        }
        else {
            min.x = b.x;
            max.x = a.x;
        }

        if (a.y < b .y) {
            min.y = a.y;
            max.y = b.y;
        }
        else {
            min.y = b.y;
            max.y = a.y;
        }

        return ((p.x >= min.x) && (p.x <= max.x)) && ( (p.y >= min.y) && (p.y <= max.y))
    }

    return this;
}

$(function() {
    var server = pickrAPIService(image_key)
    var pick_radius = pickDrawing.setup('image-div')
    
    var the_list = new PointList()
    the_list.setTolerance(pick_radius)

    pickDrawing.onPick(function(x1, y1, x0, y0) {
        var start = new Point(x0,y0)
        var end = new Point(x1,y1)
        if (the_list.contains(start))
            the_list.replace(start, end)
        else if (the_list.isIntersection(end))
            the_list.insertAtIntersection(end)
        else
            the_list.add(end)    
        pickDrawing.refresh(the_list.get_points());
    })

    $('#clear-button').click(function() {
        pickDrawing.clear()
        the_list.clear()
    });

    $('#undo-button').click(function() {
        the_list.remove_last()
        pickDrawing.refresh(the_list.get_points())
    });

    $('#submit-button').click(function() {
        server.send_picks(the_list.get_points(), function() {
            window.location.replace("/results?image_key=" + image_key);
        });
    });
});
