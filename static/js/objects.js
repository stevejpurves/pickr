var Point = function(X, Y, group) {
    this.x = X || 0;
    this.y = Y || 0;
    this.group = group || 0;
    this.equals = function(r, tol) {
        if (!tol) tol = 0;
        return (Math.abs(this.x - r.x) <= tol)
            && (Math.abs(this.y - r.y) <= tol)
            // && this.group === r.group;
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

    this.log_close_group = function(idx) {
        log_it({action:'close', group:idx}, {can_undo:true})
        return last()
    }

    this.undo = function(interpretation) {
        var last = undo_stack.pop()
        if (last)
            if (last.action === 'move') {
                interpretation.replace(last.to, last.from)
                undo_stack.pop() // avoid circular move
            }
            else if (last.action === 'close') {
                interpretation.set_active_group(last.group)
                undo_stack.pop()
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
    var num_groups = 1;
    var group_idx = 0;
    

    this.load_raw = function(raw) {
        points = []
        for (var i = 0; i < raw.length; i++) {
            var p = new Point(raw[i][0], raw[i][1])
            if (raw[i].length === 3) p.group = raw[i][2]
            points.push( p )
            if (p.group+1 > num_groups) num_groups = p.group+1           
        }
    }

    this.get_points = function() {
        return points;
    };

    this.get_groups = function() {
        var groups = [[]]
        // create a non-sparse group array
        var groups = []
        for (var g = 0; g < num_groups; g++)
            groups[g] = []
        for (var i = 0; i < points.length;i++)
            groups[points[i].group].push(points[i])
        return groups
    };

    this.add = function(p) {
        p.group = group_idx
        points.push(p);
        history.log_add(points.length-1, p);
    };

    this.insertAt = function(p, after) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(after, tol)) {
                p.group = points[i].group
                points.splice(i+1, 0, p);
                history.log_add(i+1, p);                
            }
    };

    this.replace = function(p_old, p_new) {
        for (var i = 0; i < points.length; i++)
            if (points[i].equals(p_old, tol)) {
                p_new.group = points[i].group
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
    }

    this.new_group = function() {
        group_idx = num_groups
        num_groups += 1
    }

    this.set_active_group = function(idx) {
        group_idx = idx
    }

    this.setTolerance = function(t) { tol = t; };

    return this;
};