


var Point = function(X, Y) {
    this.x = X;
    this.y = Y;
    return this;
}

Point.equal = function(a, b, tol) {
    if (!tol) tol = 0
    return (Math.abs(a.x - b.x) <= tol) 
        && (Math.abs(a.y - b.y) <= tol);
}

var PointList = function()
{
    var tol = 0;
    this.points = []
    this.push = function(x) { this.points.push(x) }
    this.pop = function() { this.points.pop() }
    this.clear = function() { this.points = [] }
    this.setTolerance = function(t) { tol = t }
    this.contains = function(p) {
        for (var i = 0; i < this.points.length; i++)
            if (Point.equal(this.points[i], p, tol))
                return true;
        return false;
    }
    this.isIntersection = function(p) {
        for (var i = 0; i < this.points.length-1; i++) {
            if (this._colinear(this.points[i], this.points[i+1], p)) {
                return true;
            }
        }
        return false;
    }
    this.insertAtIntersection = function(p) {
        for (var i = 0; i < this.points.length-1; i++) {
            if (this._colinear(this.points[i], this.points[i+1], p)) {
                this.points.splice(i+1, 0, p)
                return true
            }
        }
    }
    this.replace = function(p_old, p_new) {
        for (var i = 0; i < this.points.length; i++)
            if (Point.equal(this.points[i], p_old, tol)) {
                this.points[i] = p_new
                return true
            }
        return false
    }

    this._colinear = function(a, b, c) {
        var segment_length = Math.sqrt( Math.pow(a.x-b.x,2) + Math.pow(a.y-b.y,2) )
        var abs_xprod = Math.abs((c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y))
        return abs_xprod < (1.1 * segment_length)
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
            the_list.push(end)    
        pickDrawing.refresh(the_list.points);
        // server.update_pick(end)
    })

    $('#clear-button').click(function() {
        pickDrawing.clear()
        // server.delete()
        the_list.clear()
    });

    $('#undo-button').click(function() {
        the_list.pop()
        pickDrawing.refresh(the_list.points)
        // server.remove_last_point()
    });

    $('#submit-button').click(function() {
        var p = the_list.points
        server.send_picks(the_list.points, function() {
            window.location.replace("/results?image_key=" + image_key);
        });
    });
});
