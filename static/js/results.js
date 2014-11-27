$(function() {

    // From results.html
    // var interpretationCount = {{ count }}; // The number of interpretations on this image.
    // var pickUsers = [];   // A list
    // var current = 0;  // An index for stepping over the list

    // var ownerUser = "{{ owner_user }}";
    // var currentUser = "{{ user_id }}"; // Start with this one
    // var userID = "{{ user_id }}";

    var current = 0;  // An index for stepping over the list
    var currentUser = pickUsers[current];

    pickDrawing.setup('image-div');
    var overlay = pickDrawing.addOverlay('data:image/png;base64,' + 
           overlay64);
    
    var updateVoteCount = function(voteCount){
        // Set the element text to the vote count
        $('#vote-count').text(parseInt(voteCount["votes"]));

        // Update the button to reflect users current choice
        var user_choice = voteCount["user_choice"];
        if (user_choice == 1){
            document.getElementById("thumbs-up").style.color = "green";
            document.getElementById("thumbs-down").style.color = "grey";
        } else if (user_choice ==-1){
            document.getElementById("thumbs-up").style.color = "grey";
            document.getElementById("thumbs-down").style.color = "red";
        } else {
            document.getElementById("thumbs-up").style.color = "grey";
            document.getElementById("thumbs-down").style.color = "grey";
        }
    };
   
    var loadPicks = function(user){
      $.get('/vote',
            {user:user, image_key:image_key}, 
            updateVoteCount
            );

      // This loads the picks for 'currentUser' who is not the 
      // currently-logged-in user, but the one in the pick
      // review cycle. 
      pickDrawing.load({user:user,
                        image_key: image_key
                        });
    };

    $('#me-button').on('click', function(){
        // Toggles the user's own interpretation
        $(this).button('toggle');
        if ($(this).hasClass('active')){
          loadPicks(userID);
          $('#owner-up-vote-button').addClass('disabled');
          $('#owner-down-vote-button').addClass('disabled');
          $('#up-vote-button').addClass('disabled');
          $('#down-vote-button').addClass('disabled');
          $('#next-button').addClass('disabled');
          $('#previous-button').addClass('disabled');
        } else {
          pickDrawing.clear(); // Bah, deletes everything!
        }
        if ($('#owner-button').hasClass('active')){
          $('#owner-button').button('toggle');
        }
        if ($('#everyone-button').hasClass('active')){
          $('#everyone-button').button('toggle');
        }
    });

    $('#owner-button').on('click', function(){
        $(this).button('toggle');
        if ($(this).hasClass('active')){
          $('#owner-up-vote-button').removeClass('disabled');
          $('#owner-down-vote-button').removeClass('disabled');
          $('#up-vote-button').addClass('disabled');
          $('#down-vote-button').addClass('disabled');
          $('#next-button').addClass('disabled');
          $('#previous-button').addClass('disabled');
          loadPicks(ownerUser);
        } else {
          pickDrawing.clear(); // Bah, deletes everything!
        }
        if ($('#me-button').hasClass('active')){
          $('#me-button').button('toggle');
        }
        if ($('#everyone-button').hasClass('active')){
          $('#everyone-button').button('toggle');
        }
    });

    $('#everyone-button').on('click', function(){
        // Toggles everyone else's interpretations
        // Then you can step over these with the 
        // previous-button and next-button
        $(this).button('toggle');
        if ($(this).hasClass('active')){
          loadPicks(currentUser);
          $('#owner-up-vote-button').addClass('disabled');
          $('#owner-down-vote-button').addClass('disabled');
          $('#up-vote-button').removeClass('disabled');
          $('#down-vote-button').removeClass('disabled');
          $('#next-button').removeClass('disabled');
          $('#previous-button').removeClass('disabled');

        } else {
          pickDrawing.clear(); // Bah, deletes everything!
        }
        if ($('#owner-button').hasClass('active')){
          $('#owner-button').button('toggle');
        }
        if ($('#me-button').hasClass('active')){
          $('#me-button').button('toggle');
        }
    });

    $('#previous-button').on('click', function(){
        if (current <= 0){
          $('#previous-button').addClass('disabled');
          return;
        } else {
          $('#next-button').removeClass('disabled');
          --current;
        }
        currentUser = pickUsers[current];
        loadPicks(currentUser);
    });

    $('#next-button').on('click', function(){
        if (current >= userCount - 1){
          $('#next-button').addClass('disabled');
          return;
        } else {
          $('#previous-button').removeClass('disabled');
          ++current;
        }
        currentUser = pickUsers[current];
        loadPicks(currentUser);
    });
    
    var castVote = function(v){
       $.post('/vote',{
           user: currentUser,
           image_key: image_key,
           vote: v
       }, updateVoteCount);
    };
    
    $('#up-vote-button').on('click', function(){
        castVote(1);
    });

    $('#down-vote-button').on('click', function(){
        castVote(-1);
    });
    
    $( "#overlay-slider" )
        .slider({min: 0, max: 100, value:67, change: function( event, ui ) {
            console.log(overlay);
            overlay.animate({opacity: ui.value / 100});
        }});

  loadPicks(userID);

});
