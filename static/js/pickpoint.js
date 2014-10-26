$(function() {
    var paper = Raphael('seismic-div', 1080, 720);
    paper.image('/static/data/Alaska.png', 0, 0, 1080, 720);
    
    var points = [];
    var circles = [];
    var linestrip;    

    var addCircle = function(x, y)
    {
        var radius = 4;
        var circle = paper.circle(x, y, radius);
        circle.attr("fill", "#f00");
        circle.attr("stroke", "#fff");
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
        linestrip.attr("stroke", "#f00");
    }
    
    var addPoint = function(point){
        addCircle(point.x, point.y);
        points.push(point);
        connectTheDots();
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

    $('#seismic-div').click(function(e) {
        var imageX = e.pageX - this.offsetLeft;
        var imageY = e.pageY - this.offsetTop - 2;
        var point = { x: imageX, y: imageY };
        $.post('/update_pick', point, 
            function(){addPoint(point)});
    });
    
    var reloadPoints = function()
    {
        $.get('/update_pick?user_picks=1', {}, function(data)
        {
           data.forEach(function(item){
               addPoint({x:item[0], y:item[1]});
           });
        }, "json");
    }
    reloadPoints();
    

    $('#clear-button').click(function(){
	$.ajax("/update_pick?clear=1",{
	        type: "DELETE",
            success: function(){
		        clearPoints();
            }
	   });
    });

    $('#undo-button').click(function(){
        $.ajax("/update_pick?undo=1", {
            type: "DELETE",
            dataType: "json",
            success: function(p){
		        removePoint({x: p[0], y: p[1]});
		     }
        });
    });

});

