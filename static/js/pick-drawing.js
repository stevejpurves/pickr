// Globals defined in pickpoint.html...
// image_url = "{{ img_obj.url(size=1200) }}";
// image_key = "{{ img_obj.id }}";
// baseImageWidth = "{{ img_obj.width }}";
// baseImageHeight = "{{ img_obj.height }}";
// pickstyle = "{{ img_obj.pickstyle }}";

pickDrawingSetup = function(){
    var pickrElement;
    var paper;
    var baseImage;
    var overlay
    var mode;   

    window.ondragstart = function() { return false; } ;

    var cfg = {}
    cfg.colour = {}
    cfg.styles = {}

    cfg.colour.owner   = "#0000FF"; // Image owner
    cfg.colour.current = "#00DD00"; // Current user
    cfg.colour.default = "#FF0000"; // Everyone else

    var circles;
    var segments;
    var linestrip;    
    
    var aspectRatio = baseImageWidth / baseImageHeight;
    var avgImageSize = (baseImageWidth + baseImageHeight) / 2;
    var resizeScale;

    var handler = { pick:null, move:null, insert: null }
    var server = pickrAPIService(image_key);
    var currentMousePosition = null;

    var updatePaperSize = function(){
        var w = pickrElement.width();
        var h = w / aspectRatio;
        resizeScale = w / baseImageWidth;
        paper.setSize(w, h);
    };

    var getPointFromEvent = function(e) {
        var x = e.offsetX || e.pageX - pickrElement.offset().left;
        var y = e.offsetY || e.pageY - pickrElement.offset().top;
        return new Point(Math.round(x / resizeScale), Math.round((y-cfg.cursor_y_offset) / resizeScale));
    };

    var onPick = function(cb) {
        handler.pick = cb;
        baseImage.click( function(e) {
            var p = getPointFromEvent(e);
            handler.pick(p);
        });
    };

    var onMove = function(cb) {
        handler.move = cb;
    };

    var onInsert = function(cb) {
        handler.insert = cb;
    };
    
    var setup = function(elementId, the_mode) {
        mode = the_mode || "picking";

        pickrElement = $('#' + elementId);
        paper = Raphael(elementId);
  
        updatePaperSize();
        paper.setViewBox(0, 0, baseImageWidth, baseImageHeight);
        baseImage = paper.image(image_url, 0, 0, baseImageWidth, baseImageHeight);
        circles = paper.set();
        segments = paper.set();
        $(window).resize(updatePaperSize);

        cfg.cursor_y_offset = 2;
        cfg.penSize = 4;
        cfg.styles.hoverIn = {'opacity':'0.9'};
        cfg.styles.hoverOut = {'opacity':'0.5'};
        cfg.styles.circle_radius = 4*cfg.penSize/(3*resizeScale);
        cfg.styles.segment = {'stroke-width': 1.2*cfg.penSize, 'opacity': 0.5};
        cfg.styles.segment_dashed = {'stroke-dasharray':"."};
        cfg.styles.circle = { stroke: '#fff', opacity: 0.5 };
        cfg.styles.circle_startMove = {fill: '#0f0', opacity: 0.9};
        cfg.styles.circle_endMove = {opacity: 0.5};
        cfg.styles.overlay = {opacity: 0.67};

        baseImage.mousemove(function(e) {
            currentMousePosition = getPointFromEvent(e);
        })

        return cfg.penSize;  
    };
    
    var renderOverlay = function(url) {
        if (overlay) overlay.remove()
        overlay = paper.image(url, 0, 0, baseImageWidth, baseImageHeight);
        overlay.undrag();
        return overlay.attr(cfg.styles.overlay);
    };

    var updateOverlay = function(url) {
        overlay.node.href.baseVal = url;
    }

    var hoverIn = function() { this.attr( cfg.styles.hoverIn ); };
    var hoverOut = function() { this.attr( cfg.styles.hoverOut ); };

    var indexOfCircle = function(c) {
        for (var i = 0; i < circles.length; i++)
            if (circles[i] === c)
                return i;
        return 0;
    }

    var findCircleForPoint = function(p) {
        for (var i = 0; i < circles.length; i++)
            if (circles[i].point.equals(p))
                return circles[i]
        return null
    }

    var addCircle = function(p, colour) {
        var circle = paper.circle(p.x, p.y, cfg.styles.circle_radius);
        circle.point = p;
        circle.attr(_.extend({ fill: colour }, cfg.styles.circle));

        if (handler.move) {
            var p0, p0idx;
            var left = null
            var right = null

            var start = function(x, y, e) {
                this.attr(cfg.styles.circle_startMove );
                p0 = getPointFromEvent(e);
                if (pickstyle === 'lines' || pickstyle === 'polygons') {
                    for (var i = 0; i < segments.length; i++) {
                        if (segments[i].p0.equals(p0, cfg.penSize))
                            right = segments[i]
                        else if (segments[i].p1.equals(p0, cfg.penSize))
                            left = segments[i]
                    }
                }
            }
            var move = function(dx, dy, x, y, e) {
                var p = getPointFromEvent(e);
                this.attr({'cx':p.x, 'cy':p.y});
                if (left)
                    left.attr({ path: writeSegmentPath(left.p0, p) });
                if (right)
                    right.attr({path: writeSegmentPath(p, right.p1) });
            }
            var end = function(e) {
                this.attr(_.extend({fill: colour}, cfg.styles.circle_endMove));
                left = null
                right = null
                var p1 = getPointFromEvent(e);
                handler.move(p1, p0);
            }

            circle.drag(move, start, end, circle, circle, circle)
            circle.hover(hoverIn, hoverOut, circle, circle)

            if (circle.isPointInside(currentMousePosition.x, currentMousePosition.y))
                hoverIn.apply(circle);
        }

        circles.push(circle);
    };

    var writeSegmentPath = function(p0, p1) {
        var path = '';
        path += 'M' + p0.x + ',' + p0.y; // moveTo
        path += 'L' + p1.x + ',' + p1.y; // lineTo
        return path;
    }

    var addSegment = function(p0, p1, colour) {
        var path = writeSegmentPath(p0, p1);
        var segment = paper.path(path);
        segment.p0 = p0
        segment.p1 = p1
        segment.attr(_.extend({'stroke': colour}, cfg.styles.segment));

        if (handler.insert) {
            segment.click(function(e) {
                e.preventDefault();
                handler.insert(getPointFromEvent(e), p0);
            })
            segment.hover(hoverIn, hoverOut, segment, segment)                
        }

        segments.push(segment);
        return segment;
    }

    var drawSegments = function(groups, colour) {
        for (var g = 0; g < groups.length; g++) {
            var points = groups[g]
            if (points) {
                for (var i = 0; i < points.length-1; i++)
                    addSegment(points[i], points[i+1], colour)
                if (pickstyle === "polygons") {
                    var auto = addSegment(points[points.length-1], points[0], colour)
                    if (mode === "picking" && g === groups.length-1)
                        auto.attr(cfg.styles.segment_dashed)
                }
            }
        }
        if (segments.length > 0) circles.insertAfter(segments)
    }
    
    var clear = function() {
        circles.remove();
        circles.clear();
        segments.remove();
        segments.clear();
    }

    var draw = function(points, colour) {
        var groups = [[]]
        for (var i = 0, g_idx = 0; i < points.length; i++) {
            var p = points[i]
            addCircle(p, colour)
            if (!p.group || p.group === g_idx)
                groups[g_idx].push(p)
            else {
                g_idx = p.group
                groups[g_idx] = [p]
            }
        }
        if (pickstyle === 'lines' || pickstyle === 'polygons')
            drawSegments(groups, colour)
    }

    var refresh = function(points, colour) {
        clear();
        if (points.length === 0) return
        draw(points, colour || cfg.colour.default);
    };

    return {
        colour: { default: cfg.colour.default, current: cfg.colour.current, owner: cfg.colour.owner },
        setup: setup,
        onPick: onPick,
        onMove: onMove,
        onInsert: onInsert,
        refresh: refresh,
        draw: draw,
        clear: clear,
        renderOverlay: renderOverlay
    };
};

var pickDrawing = pickDrawingSetup();
