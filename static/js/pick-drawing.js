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

    var onPick = function(cb) {
        $(pickrElement).mousedown(function(e) {
            var x0 = Math.round( (e.pageX - this.offsetLeft) / resizeScale );
            var y0 = Math.round( (e.pageY - this.offsetTop - 2) / resizeScale );
            $(pickrElement).mouseup(function(e) {
                var x1 = Math.round( (e.pageX - this.offsetLeft) / resizeScale );
                var y1 = Math.round( (e.pageY - this.offsetTop - 2) / resizeScale );
                $(pickrElement).unbind('mouseup');
                return cb(x1, y1, x0, y0);
            })
        });
    };
    
    var setup = function(elementId)
    {
        pickrElement = $('#' + elementId);
        penSize = 1 + pickrElement.width() / 400;
        paper = Raphael(elementId);
  
        updatePaperSize();
        paper.setViewBox(0, 0, baseImageWidth, baseImageHeight);
        baseImage = paper.image(image_url, 0, 0, baseImageWidth, baseImageHeight);
        $(window).resize(updatePaperSize);
        return 1 + penSize;  
    };
    
    var renderImage = function(url)
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
    
    var clearCircles = function()
    {
        circles.forEach(function(c){c.remove();});
        circles = [];   
    };
    
    var connectTheDots = function(points, colour){
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
    
    var clearAll = function(){
        clearCircles();
        if (!!linestrip) linestrip.remove();
    };

    var draw = function(points, colour) {
        points.forEach(function(p) { addCircle(p.x, p.y, colour); });
        connectTheDots(points, colour);
    }

    var refresh = function(points) {
        clearAll();
        draw(points, default_colour);
    }

    var convertToPoints = function(data) {
        var points = [];
        for (var i = 0; i < data.length; i++)
            points.push({x: data[i][0], y: data[i][1]});
        return points;
    }

    var renderResults = function(data) {
        clearAll();
        if (data.current) 
            draw(convertToPoints(data.user_data), current_colour);
        else if (data.owner)
            draw(convertToPoints(data.owner_data), owner_colour);
        else
            draw(convertToPoints(data.data), default_colour);        
    } 

    return {
        setup: setup,
        onPick: onPick,
        refresh: refresh,
        clear: clearAll,
        renderImage: renderImage,
        renderResults: renderResults
    }
};

var pickDrawing = pickDrawingSetup();
