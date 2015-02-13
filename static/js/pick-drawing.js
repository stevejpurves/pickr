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

    var circles = [];
    var segments = [];
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
        return new Point(Math.round( (e.offsetX) / resizeScale ),
            Math.round( (e.offsetY - 2) / resizeScale ) );
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
            circle.drag(function move(dx, dy, x, y, e) {
                var p = getPointFromEvent(e);
                currentMousePosition = p;
                this.attr({'cx':p.x, 'cy':p.y});
            }, function start(x, y, e) {
                p0 = getPointFromEvent(e);
                this.attr({fill: '#0f0', opacity: 0.9});
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

    var addSegment = function(p0, p1, colour) {
        var path = '';
        path += 'M' + p0.x + ',' + p0.y; // moveTo
        path += 'L' + p1.x + ',' + p1.y;
        var linestrip = paper.path(path);
        linestrip.attr({'stroke': colour});
        linestrip.attr({'stroke-width': 1.2*penSize});
        linestrip.attr({'opacity': '0.5'});

        if (handler.insert) {
            linestrip.click(function(e) {
                e.preventDefault();
                handler.insert(getPointFromEvent(e));
            })

            linestrip.hover(hoverIn, hoverOut, linestrip, linestrip)                
        }

        segments.push(linestrip);
        return linestrip;
    }
    
    var clearCircles = function() {
        circles.forEach(function(c){c.remove();});
        circles = [];   
    };

    var clearSegments = function() {
        segments.forEach(function(s) {s.remove();});
        segments = [];
    };
    
    var connectTheDots = function(points, colour) {
        if (points.length === 0) return;
        if (pickstyle === 'lines' || pickstyle === 'polygons'){
            if (segments) clearSegments();
            for (var i = 0; i < points.length-1; i++)
                addSegment(points[i], points[i+1], colour);
            if (pickstyle === "polygons") {
                addSegment(points[points.length-1], points[0], colour);
            }
        }
    };
    
    var clearAll = function() {
        clearCircles();
        clearSegments();
    };

    var draw = function(points, colour) {
        connectTheDots(points, colour);
        points.forEach(function(p) { addCircle(p.x, p.y, colour); });
    };

    var refresh = function(points) {
        clearAll();
        draw(points, default_colour);
    };

    var convertToPoints = function(data) {
        var points = [];
        for (var i = 0; i < data.length; i++)
            points.push({x: data[i][0], y: data[i][1]});
        return points;
    };

    var renderResults = function(data) {
        clearAll();
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
        clear: clearAll,
        renderImage: renderImage,
        renderResults: renderResults
    };
};

var pickDrawing = pickDrawingSetup();
