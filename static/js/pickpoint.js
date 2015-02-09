
var Point = function(X, Y) {
    this.x = X;
    this.y = Y;
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
    var points = this.points = []
    this.push = function(x) { points.push(x) }
    this.pop = function() { points.pop() }
    this.setTolerance = function(t) { tol = t }
    this.contains = function(p) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p, tol))
                return true;
        return false;
    }
    this.replace = function(p_old, p_new) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p_old, tol)) {
                points[i] = p_new
                return true
            }
        return false
    }

    return this;
}

$(function() {
    var server = pickrAPIService(image_key);
    var pick_radius = pickDrawing.setup('image-div');   
    
    var the_list = new PointList();
    the_list.setTolerance(pick_radius);

    pickDrawing.onPick(function(x1, y1, x0, y0) {
        var start = new Point(x0,y0);
        var end = new Point(x1,y1);

        if (the_list.contains(start))
            the_list.replace(start, end)
        else
            the_list.push(end)    

        pickDrawing.refresh(the_list.points);
        server.update_pick(end)
    })

    $('#clear-button').click(function() {
        pickDrawing.clear();
        server.delete();
    });

    $('#undo-button').click(function() {
        the_list.pop();
        pickDrawing.refresh(the_list.points);
        server.remove_last_point();
    });
});
