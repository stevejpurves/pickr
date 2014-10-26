$(function() {
    var interpretationCount = count;
    var current = 0;
    pickDrawing.setup('seismic-div');
    
    var loadPicks = function()
    {
        pickDrawing.load({
            pick_index: current
        });
    }
    loadPicks();

    $('#previous-button').click(function(){
        if (current <= 0)
            return;
        --current;
        loadPicks();
    });

    $('#next-button').click(function(){
        if (current >= interpretationCount - 1)
            return;
        ++current;
        loadPicks();
    });
    
    $('#vote-count').text('99');
    
    // get /vote?index=1
    // post /vote?index=1&vote=1 
});
