pickDrawingSetup = function(){

    var paper = {};
    var points = [];
    var circles = [];
    var linestrip;
    
    var baseImage;
    // TODO: Hard-coded base image size
    var baseImageWidth = 1080;
    var baseImageHeight = 720;
    var aspectRatio = baseImageWidth / baseImageHeight;
    var resizeScale = 1;
    
    var setup = function(elementId)
    {
        var element = $('#' + elementId);
        var w = element.width();
        var h = w / aspectRatio;
        resizeScale = w / baseImageWidth;
        
        paper = Raphael(elementId, w, h);
        baseImage = paper.image('/static/data/brazil_ang_unc.png', 0, 0, w, h);
        
        $(window).resize(function(){
            var w = element.width();
            var h = w / aspectRatio;
            resizeScale = w / baseImageWidth;
            if (linestrip) {
                linestrip.transform('');
                linestrip.transform('s' + resizeScale + ',' + resizeScale + ',0,0');
            }
            
            paper.setSize(w, h);
            baseImage.attr({width: w, height: h});
        });        
    }
    
    var addOverlay = function(url)
    {
        var overlay = paper.image(url, 0, 0, 1080, 720);
        return overlay.attr({opacity: 0.5});
    }

    var addCircle = function(x, y)
    {
        var radius = 4;
        var circle = paper.circle(x, y, radius);
        circle.attr({
            fill: '#f00',
            stroke: '#fff',
            opacity: 0.5
        });
        circles.push(circle);
    }
    
    var removeCircle = function(x, y)
    {
        var circle = _.find(circles, function(c){
            return c.attrs.cx === x && c.attrs.cy === y
            });
        circle.remove();
        var index = circles.indexOf(circle);
        circles.splice(index, 1);
    }
    
    var clearCircles = function()
    {
        circles.forEach(function(c){c.remove();});
        circles = [];   
    }
    
    var connectTheDots = function() // Lalalalala
    {
        if (!!linestrip)
            linestrip.remove();
        if (points.length === 0)
            return;
        points.sort(function(a,b){ 
            return parseInt(a.x) - parseInt(b.x); 
            });
        var path = '';
        path += 'M' + points[0].x + ',' + points[0].y; // moveTo
        points.forEach(function(p){
            path += 'L' + p.x + ',' + p.y; // lineTo
        });
        linestrip = paper.path(path);
        linestrip.attr({stroke: '#f00'});

        linestrip.transform('');
        linestrip.transform('s' + resizeScale + ',' + resizeScale + ',0,0');
    }
    
    var addPoint = function(point){
        addCircle(point.x, point.y);
        points.push(point);
        connectTheDots();
    }
    
    var clickPoint = function(point){
        var imagePoint = { 
            x: Math.round(point.x / resizeScale),
            y: Math.round(point.y / resizeScale)
        };
        $.post('/update_pick', imagePoint, 
            function(){addPoint(imagePoint)});
    }

    var removePoint = function(point){
        removeCircle(point.x, point.y);
        points = _.reject(points, function(p){
            return p.x === point.x && p.y === point.y;
        });
        connectTheDots();
    }
    
    var clearPoints = function(point){
        clearCircles();
        points = [];
        connectTheDots();
    }
    
    var loadPoints = function(parameters)
    {
        clearPoints();
        $.get('/update_pick?', parameters, function(data)
        {
           data.forEach(function(item){
               addPoint({x:item[0], y:item[1]});
           });
        }, 'json');
    }
    
    return {
        setup: setup,
        addOverlay: addOverlay,
        clickPoint: clickPoint,
        removePoint: removePoint,
        clear: clearPoints,
        load: loadPoints
    }
};

var pickDrawing = pickDrawingSetup();
