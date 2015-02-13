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
        var x = e.offsetX || e.layerX;
        var y = e.offsetY || e.layerY;
        return new Point(Math.round(x / resizeScale), Math.round((y-2) / resizeScale));
    }

    var onPick = function(cb) {
        handler.pick = cb;
        baseImage.click( function(e) {
            var p = getPointFromEvent(e);
            console.log("onPICK", p)
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

    var indexOfCircleAt = function(p) {
        for (var i = 0; i < circles.length; i++)
            if (circles[i].isPointInside(p.x,p.y))
                return i;
    }

    var addCircle = function(x, y, colour) {
        var radius = (4*penSize/(3*resizeScale));
        var circle = paper.circle(x, y, radius);
        
        // Add its attributes
        circle.attr({
            fill: colour,
            stroke: '#fff',
            opacity: 0.5
        });

        if (handler.move) {
            var p0;
            var left, right;
            circle.drag(function move(dx, dy, x, y, e) {
                var p = getPointFromEvent(e);
                currentMousePosition = p;
                this.attr({'cx':p.x, 'cy':p.y});



            }, function start(x, y, e) {
                p0 = getPointFromEvent(e);
                this.attr({fill: '#0f0', opacity: 0.9});

                var idx = indexOfCircleAt(p0);
                right = segments[idx];
                if (idx == 0) idx = segments.length;
                left = segments[idx-1]

                left.attr({stroke: '#0f0', opacity: 0.9});
                right.attr({stroke: '#00f', opacity: 0.9});

            }, function end(e) {
                this.attr({fill: colour, opacity: 0.5});  
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

    var addSegment = function(p0, p1, colour, opacity) {
        var path = writeSegmentPath(p0, p1);
        var segment = paper.path(path);
        segment.attr({'stroke': colour});
        segment.attr({'stroke-width': 1.2*penSize});
        segment.attr({'opacity': opacity});

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
        if (points.length === 0) return;
        if (pickstyle === 'lines' || pickstyle === 'polygons'){
            if (segments) segments.remove();
            for (var i = 0; i < points.length-1; i++)
                addSegment(points[i], points[i+1], colour, 0.5);
            if (pickstyle === "polygons") {
                addSegment(points[points.length-1], points[0], colour, 0.5);
            }
        }
    };

    var clear = function() {
        circles.remove();
        segments.remove();
    }

    var draw = function(points, colour) {        
        points.forEach(function(p) { addCircle(p.x, p.y, colour); });
        connectTheDots(points, colour);
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
