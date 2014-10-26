$(function() {
    var interpretationCount = count;
    var current = 0;
    pickDrawing.setup('seismic-div');
    
    var updateVoteCount = function(voteCount)
    {
        $('#vote-count').text(parseInt(voteCount));
    };

    var loadPicks = function()
    {
        pickDrawing.load({
            pick_index: current
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
});
