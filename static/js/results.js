$(function() {
    var interpretationCount = count;
    var current = 0;
    pickDrawing.setup('seismic-div');
    //var overlay64 = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
    var overlay = pickDrawing.addOverlay('data:image/png;base64,' + overlay64);
    
    var updateVoteCount = function(voteCount)
    {
        $('#vote-count').text(parseInt(voteCount));
    };

    var loadPicks = function()
    {
        pickDrawing.load({
            pick_index: current,
	    image_key: image_key
        });
        $.get('/vote', {index: current}, updateVoteCount);
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
    
    var castVote = function(v)
    {
       $.post('/vote',{
           index: current,
           vote: v
       },
       updateVoteCount);
    };
    
    $('#up-vote-button').click(function(){
        castVote(1);
    });

    $('#down-vote-button').click(function(){
        castVote(-1);
    });
    
    $( "#overlay-slider" )
        .slider({min: 0, max: 100, value:80, change: function( event, ui ) {
            console.log(overlay);
            overlay.animate({opacity: ui.value / 100});
        }});
});
