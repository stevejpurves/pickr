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
    
    var connectTheDots = function() // Lalalalala
    {
        if (!!linestrip)
            linestrip.remove();
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
        points.push(point);
        addCircle(point.x, point.y);
        connectTheDots();
    }

    var removePoint = function(point){
        points = _.reject(points, function(p){
            return p.x === point.x && p.y === point.y;
        });
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
	$.ajax("/update_pick?clear=1",
	       {type: "DELETE",
		success: function(data){
		    document.location.reload(true)}
	       })
    });

    $('#undo-button').click(function(){
        $.ajax("/update_pick?undo=1", {
            type: "DELETE",
            dataType: "json",
            success: function(p){
		        removePoint({x: p[0], y: p[1]});
		        removeCircle(p[0], p[1]);
		     }
        });
    });

});

