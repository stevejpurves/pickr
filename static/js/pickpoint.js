$(function() {
    var paper = Raphael('seismic-div');
    paper.image('/static/data/Alaska.png', 0, 0, 1080, 720);
    
    var drawCircle = function(x, y)
    {
        var radius = 4;
        var circle = paper.circle(x, y, radius);
        circle.attr("fill", "#f00");
        circle.attr("stroke", "#fff");
    }
    
    var points = [];
    var linestrip;
    
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

    $('#seismic-div').click(function(e) {
        var imageX = e.pageX - this.offsetLeft;
        var imageY = e.pageY - this.offsetTop - 2;
        var point = { x: imageX, y: imageY };
        $.post('/update_pick', point, 
            function(response){
                points.push(point);
                drawCircle(imageX, imageY);
                connectTheDots();
            });
    });

});
