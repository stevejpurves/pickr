$(function() {
    pickDrawing.setup('seismic-div');

    var reloadPoints = function()
    {
        $.get('/update_pick?user_picks=1', {}, function(data)
        {
           data.forEach(function(item){
               pickDrawing.addPoint({x:item[0], y:item[1]});
           });
        }, "json");
    }
    reloadPoints();

    $('#seismic-div').click(function(e) {
        var imageX = e.pageX - this.offsetLeft;
        var imageY = e.pageY - this.offsetTop - 2;
        var point = { x: imageX, y: imageY };
        $.post('/update_pick', point, 
            function(){pickDrawing.addPoint(point)});
    });
    
    $('#clear-button').click(function(){
	$.ajax("/update_pick?clear=1",{
	        type: "DELETE",
            success: function(){
		        pickDrawing.clear();
            }
	   });
    });

    $('#undo-button').click(function(){
        $.ajax("/update_pick?undo=1", {
            type: "DELETE",
            dataType: "json",
            success: function(p){
		        pickDrawing.removePoint({x: p[0], y: p[1]});
		     }
        });
    });
});
