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
    var overlay;
    
    window.ondragstart = function() { return false; } ;

    var owner_colour   = "#0000FF"; // Image owner
    var current_colour = "#00DD00"; // Current user
    var default_colour = "#FF0000"; // Everyone else

    var circles;
    var segments;
    var linestrip;    
    
    var aspectRatio = baseImageWidth / baseImageHeight;
    var avgImageSize = (baseImageWidth + baseImageHeight) / 2;
    var penSize;      // We will set these later.
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
        return new Point(Math.round(x / resizeScale), Math.round((y-2) / resizeScale));
    }

    var onPick = function(cb) {
        handler.pick = cb;
        baseImage.click( function(e) {
            var p = getPointFromEvent(e);
            handler.pick(p);
        } );
    };

    var onMove = function(cb) {
        handler.move = cb;
    };

    var onInsert = function(cb) {
        handler.insert = cb;
    };
    
    var setup = function(elementId) {
        pickrElement = $('#' + elementId);
        penSize = 4;
        paper = Raphael(elementId);
  
        updatePaperSize();
        paper.setViewBox(0, 0, baseImageWidth, baseImageHeight);
        baseImage = paper.image(image_url, 0, 0, baseImageWidth, baseImageHeight);
        circles = paper.set();
        segments = paper.set();
        $(window).resize(updatePaperSize);

        baseImage.mousemove(function(e) {
            currentMousePosition = getPointFromEvent(e);
        })

        return penSize;  
    };
    
    var renderImage = function(url) {
        overlay = paper.image(url, 0, 0, baseImageWidth, baseImageHeight);
        overlay.undrag();
        return overlay.attr({opacity: 0.67});
    };

    var hoverIn = function() { this.attr({'opacity':'0.9'}) }
    var hoverOut = function() { this.attr({'opacity':'0.5'}) }

    var indexOfCircle = function(c) {
        for (var i = 0; i < circles.length; i++)
            if (circles[i] === c)
                return i;
        return 0;
    }

    var addCircle = function(p, colour) {
        var radius = (4*penSize/(3*resizeScale));
        var circle = paper.circle(p.x, p.y, radius);
        
        // attach the point
        circle.point = p;

        // Add its attributes
        circle.attr({
            fill: colour,
            stroke: '#fff',
            opacity: 0.5
        });

        if (handler.move) {
            var p0, p0idx;
            var left = { seg: null, circle: null};
            var right = { seg: null, circle: null};
            circle.drag(function move(dx, dy, x, y, e) {
                var p = getPointFromEvent(e);
                this.attr({'cx':p.x, 'cy':p.y});
                if (left.seg)
                    left.seg.attr({ path: writeSegmentPath(left.circle.point, p) });
                if (right.seg)
                    right.seg.attr({path: writeSegmentPath(p, right.circle.point) })
            }, function start(x, y, e) {
                this.attr({fill: '#0f0', opacity: 0.9});
                p0 = getPointFromEvent(e);

                if (pickstyle === 'lines' || pickstyle === 'polygons') {
                    p0idx = indexOfCircle(this);
                    right.seg = segments[p0idx];
                    right.circle = (p0idx < circles.length-1) ? circles[p0idx+1] : 
                                    (pickstyle === 'polygons') ? circles[0] : null;
                    if (p0idx < circles.length-1)
                        right.circle = circles[p0idx+1]
                    else if (pickstyle === 'polygons')
                        right.circle = circles[0]
                    if (p0idx > 0) {
                        left.seg = segments[p0idx-1];
                        left.circle = circles[p0idx-1];
                    }
                    else if (pickstyle === 'polygons') {
                        left.seg = segments[segments.length-1];
                        left.circle = circles[circles.length-1];
                    }
                }
            }, function end(e) {
                this.attr({fill: colour, opacity: 0.5});
                left.seg = left.circle = right.seg = right.circle = null;
                var p1 = getPointFromEvent(e);
                handler.move(p1, p0);
            }, circle, circle, circle)

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

    var addSegment = function(p0, p1, options) {
        var path = writeSegmentPath(p0, p1);
        var segment = paper.path(path);
        segment.attr(options);
        if (handler.insert) {
            segment.click(function(e) {
                e.preventDefault();
                handler.insert(getPointFromEvent(e));
            })
            segment.hover(hoverIn, hoverOut, segment, segment)                
        }

        segments.push(segment);
    }
    
    var connectTheDots = function(points, colour) {
        if (pickstyle === 'lines' || pickstyle === 'polygons'){
            if (segments.length > 0) segments.remove();
            var options = {'stroke': colour, 'stroke-width': 1.2*penSize, 'opacity': 0.5};
            for (var i = 0; i < points.length-1; i++)
                addSegment(points[i], points[i+1], options);
            if (pickstyle === "polygons") {
                var auto_segment = options;
                auto_segment['stroke-dasharray'] = ".";
                addSegment(points[points.length-1], points[0], auto_segment);
            }
        }
    };

    var clear = function() {
        circles.remove();
        circles.clear();
        segments.remove();
        segments.clear();
    }

    var draw = function(points, colour) {
        for (var i = 0; i < points.length; i++)   
            addCircle(points[i], colour);
        connectTheDots(points, colour);
        if (segments.length > 0)
            circles.insertAfter(segments);
    };

    var refresh = function(points) {
        clear();
        draw(points, default_colour);
    };

    var convertToPoints = function(data) {
        var points = [];
        for (var i = 0; i < data.length; i++)
            points.push({x: data[i][0], y: data[i][1]});
        return points;
    };

    var renderResults = function(data) {
        clear();
        if (data.current) 
            draw(convertToPoints(data.user_data), current_colour);
        else if (data.owner)
            draw(convertToPoints(data.owner_data), owner_colour);
        else
            draw(convertToPoints(data.data), default_colour);        
    };

    return {
        setup: setup,
        onPick: onPick,
        onMove: onMove,
        onInsert: onInsert,
        refresh: refresh,
        clear: clear,
        renderImage: renderImage,
        renderResults: renderResults
    };
};

var pickDrawing = pickDrawingSetup();
