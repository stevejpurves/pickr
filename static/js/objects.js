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

var PickHistory = function() {
    var history = []

    var last = function() {
        if (history.length === 0) return
        console.log(history)
        return history[history.length-1]
    }

    this.clear = function() {
        history = []
    }

    this.log_add = function(idx, point) {
        history.push({action: 'add', idx: idx, point: point})
        return last()
    }
    this.log_insert = function(idx, point) {
        history.push({action:'insert', idx: idx, point: point})
        return last()
    }
    this.log_move = function(idx, to, from) {
        history.push({action:'move', idx: idx, to: to, from: from})
        return last()
    }
    this.log_remove = function(idx, point) {
        history.push({action:'remove', idx: idx, point: point})
        return last()
    }
    this.json = function() {
        return JSON.stringify(history)
    }
    return this;
}

var UndoStack = function()
{
    var the_stack = [];

    this.push = function(historyItem) {
        the_stack.push(historyItem)
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
    var history = new PickHistory();
    var undo_stack = new UndoStack();
    
    this.get_points = function() {
        return points;
    };

    this.add = function(p) {
        points.push(p);
        undo_stack.push(history.log_add(points.length-1, p));
    };

    this.insertAt = function(p, at) {
        points.splice(at+1, 0, p);
        undo_stack.push(history.log_add(at+1, p));
    };

    this.replace = function(p_old, p_new) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p_old, tol)) {
                undo_stack.push(history.log_move(i, p_new, points[i]))
                points[i] = p_new;
                return true;
            }
        return false;
    };

    this.remove_last = function() {
        var last = undo_stack.pop();
        if (last.action === 'move') {
            this.replace(points[last.idx], last.from)
            undo_stack.pop()
        }
        else {
            history.log_remove(last.idx, points[last.idx])
            points.splice(last.idx, 1);
        }
    };

    this.clear = function() { 
        points = []
        history.clear()
    };

    this.setTolerance = function(t) { tol = t; };

    return this;
};