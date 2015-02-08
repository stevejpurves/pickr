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

    var onClick = function(cb) {
        $(pickrElement).click(function(e) {
            var imageX = e.pageX - this.offsetLeft;
            var imageY = e.pageY - this.offsetTop - 2;
            var point = { x: Math.round(imageX / resizeScale), y: Math.round(imageY / resizeScale) };
            addPoint(point, default_colour);
            return cb(point);
        });
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
        if (points.length === 0) return;
        if (pickstyle === 'lines' || pickstyle === 'polygons'){
            if (linestrip) linestrip.remove();
            var path = '';
            path += 'M' + points[0].x + ',' + points[0].y; // moveTo
            points.forEach(function(p){
                path += 'L' + p.x + ',' + p.y; // lineTo
            });
            if (pickstyle === "polygons") path += "Z";
            linestrip = paper.path(path);
            linestrip.attr({'stroke': colour});
            linestrip.attr({'stroke-width':penSize});
            linestrip.attr({'opacity':'0.5'});
        }
    };
    
    var addPoint = function(point, colour){
        addCircle(point.x, point.y, colour);
        points.push(point);
        connectTheDots(colour);
    };

    var removePoint = function(point) {
        removeCircle(point.x, point.y);
        points = _.reject(points, function(p){
            return p.x === point.x && p.y === point.y;
        });
        connectTheDots(default_colour);
    };
    
    var clearAll = function(){
        clearCircles();
        if (!!linestrip) linestrip.remove();
        points = [];
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
        clearAll();
        if (data.current) drawAsCurrentUser(data.user_data);
        else if (data.owner) drawAsOwner(data.owner_data);
        else drawAsOther(data.data);        
    } 

    return {
        setup: setup,
        onClick: onClick,
        addOverlay: addOverlay,
        removePoint: removePoint,
        clear: clearAll,
        draw: draw
    }
};

var pickDrawing = pickDrawingSetup();
