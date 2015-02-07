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
    
    window.ondragstart = function() { return false; } ;

    var owner_colour   = "#0000FF"; // Image owner
    var current_colour = "#00DD00"; // Current user
    var default_colour = "#FF0000"; // Everyone else

    var points = [];
    var circles = [];
    var linestrip;    
    
    var aspectRatio = baseImageWidth / baseImageHeight;
    var avgImageSize = (baseImageWidth + baseImageHeight) / 2;
    var penSize = avgImageSize / 200;
    var resizeScale = 1;
    
    var server = pickrAPIService(image_key);

    var updatePaperSize = function(){
        var w = pickrElement.width();
        var h = w / aspectRatio;
        resizeScale = w / baseImageWidth;
        paper.setSize(w, h);
    };
    
    var setup = function(elementId)
    {
        pickrElement = $('#' + elementId);
        penSize = 1 + pickrElement.width() / 400;
        paper = Raphael(elementId);
  
        updatePaperSize();
        paper.setViewBox(0, 0, baseImageWidth, baseImageHeight);
        baseImage = paper.image(image_url, 0, 0, baseImageWidth, 
        baseImageHeight);
        $(window).resize(updatePaperSize);        
    };
    
    var addOverlay = function(url)
    {
        var overlay = paper.image(url, 0, 0, baseImageWidth, baseImageHeight);
        overlay.undrag();
        return overlay.attr({opacity: 0.67});
    };

    var addCircle = function(x, y, colour)
    {
        var radius = 1 + penSize;
        var circle = paper.circle(x, y, radius);
        circle.attr({
            fill: colour,
            stroke: '#fff',
            opacity: 0.5
        });
        circles.push(circle);
    };
    
    var removeCircle = function(x, y)
    {
        var circle = _.find(circles, function(c){
            return c.attrs.cx === x && c.attrs.cy === y
            });
        circle.remove();
        var index = circles.indexOf(circle);
        circles.splice(index, 1);
    };
    
    var clearCircles = function()
    {
        circles.forEach(function(c){c.remove();});
        circles = [];   
    };
    
    var connectTheDots = function(colour){
        if (!!linestrip)
            linestrip.remove();
        if (points.length === 0)
            return;
        // points.sort(function(a,b){ 
        //     return parseInt(a.x) - parseInt(b.x); 
        //     });
        var path = '';
        path += 'M' + points[0].x + ',' + points[0].y; // moveTo
        points.forEach(function(p){
            path += 'L' + p.x + ',' + p.y; // lineTo
        });
        if (pickstyle === "polygons"){
          path += "Z"; // closed line
        }
        linestrip = paper.path(path);
        linestrip.attr({'stroke': colour});
        linestrip.attr({'stroke-width':penSize});
        linestrip.attr({'opacity':'0.5'});
    };
    
    var addPoint = function(point, colour){
        if (!colour)
            colour = default_colour;
        addCircle(point.x, point.y, colour);
        points.push(point);
        if (pickstyle === 'lines' || pickstyle === 'polygons'){
            connectTheDots(colour);
        }
    };
    
    var imagePositionToPoint = function(x, y) {
        var point = { x: Math.round(x / resizeScale),
                y: Math.round(y / resizeScale) };
        return point;
    }

    // picking controller
    // var clickPoint = function(point){
    //     var data = { image_key:image_key,
    //         x: Math.round(point.x / resizeScale),
    //         y: Math.round(point.y / resizeScale)
    //     };
    //     server.update_pick( data, function() { addPoint(data, default_colour ) });
    // };

    var removePoint = function(point){
        removeCircle(point.x, point.y);
        points = _.reject(points, function(p){
            return p.x === point.x && p.y === point.y;
        });
        if (pickstyle === 'lines' || pickstyle === 'polygons'){
            connectTheDots(default_colour);
        }
    };
    
    var clearPoints = function(){
        clearCircles();
        points = [];

        // Not sure why we connect after clearing...?
        if (pickstyle === 'lines' || pickstyle === 'polygons'){
            connectTheDots(default_colour);
        }
    };

    var drawAsCurrentUser = function(points) {
        points.forEach(function(item) {
                addPoint({x:item[0], y:item[1]}, current_colour);
            });
    }

    var drawAsOwner = function(points) {
        points.forEach(function(item){
                addPoint({x:item[0], y:item[1]}, owner_colour);
            });
    }

    var drawAsOther = function(points) {
        points.forEach(function(item){
                addPoint({x:item[0], y:item[1]}, default_colour);
            });
    }

    var draw = function(data) {
        clearPoints();
        if (data.current) drawAsCurrentUser(data.user_data);
        else if (data.owner) drawAsOwner(data.owner_data);
        else drawAsOther(data.data);        
    } 

    return {
        setup: setup,
        addOverlay: addOverlay,
        addPoint: addPoint,
        removePoint: removePoint,
        imagePositionToPoint: imagePositionToPoint,
        clear: clearPoints,
        draw: draw
    }
};

var pickDrawing = pickDrawingSetup();
