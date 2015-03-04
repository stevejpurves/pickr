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
    this.push = function(historyItem) {
        the_stack.push(historyItem)
    }
    this.pop = function()
    {
        var popped = the_stack[the_stack.length-1];
        the_stack.pop();
        return popped;
    }
    this.clear = function() {
        the_stack = []
    }
    return this;
}

var PickHistory = function() {
    var history = []
    var undo_stack = new UndoStack();

    var last = function() {
        if (history.length === 0) return
        return history[history.length-1]
    }

    var log_it = function(item, options) {
        item.timestamp = Date.now()
        history.push(item)
        if (options.can_undo) undo_stack.push(last())
    }

    this.clear = function() {
        history = []
        undo_stack.clear()
    }

    this.log_add = function(idx, point) {
        log_it({action: 'add', idx: idx, point: point}, {can_undo:true})
        return last()
    }

    this.log_move = function(idx, to, from) {
        log_it({action:'move', idx: idx, to: to, from: from}, {can_undo:true})
        return last()
    }
    this.log_remove = function(idx, point) {
        log_it({action:'remove', idx: idx, point: point}, {can_undo:false})
        return last()
    }
    this.undo = function(interpretation) {
        var last = undo_stack.pop()
        if (last)
            if (last.action === 'move') {
                interpretation.replace(last.to, last.from)
                undo_stack.pop() // avoid circular move
            }
            else {
                interpretation.remove(last.idx)
            }
    }
    this.raw = function() {
        return history;
    }
    this.json = function() {
        return JSON.stringify(history)
    }
    return this;
}

var Interpretation = function(the_pick_history)
{
    var self = this;
    var tol = 0;
    var points = [];
    var history = the_pick_history;
    
    this.get_points = function() {
        return points;
    };

    this.add = function(p) {
        points.push(p);
        history.log_add(points.length-1, p);
    };

    this.insertAt = function(p, at) {
        points.splice(at+1, 0, p);
        history.log_add(at+1, p);
    };

    this.replace = function(p_old, p_new) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p_old, tol)) {
                history.log_move(i, p_new, points[i])
                points[i] = p_new;
                return true;
            }
        return false;
    };

    this.remove = function(idx) {
        history.log_remove(idx, points[idx])
        points.splice(idx, 1);
    }

    this.clear = function() { 
        points = []
        history.clear()
    };

    this.setTolerance = function(t) { tol = t; };

    return this;
};