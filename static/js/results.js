$(function() {

    // From results.html
    // =================
    // var interpretationCount = {{ count }}; 
    // var pickUsers = [];   // A list
    // var ownerUser = "{{ owner_user }}";
    // var userID = "{{ user_id }}";
    // var image_url = "{{ img_obj.url(size=1200) }}";
    // var image_key = "{{ img_obj.key().id() }}";
    // var baseImageWidth = "{{ img_obj.width }}";
    // var baseImageHeight = "{{ img_obj.height }}";
    // var pickstyle = "{{ img_obj.pickstyle }}";

    var server = pickrAPIService(image_key);
    var current = 0;  // An index for stepping over the list
    var currentUser = pickUsers[current];

    pickDrawing.setup('image-div', 'rendering');

    // Ajax call to get the heatmap
    $.get('/heatmap?image_key=' + image_key, function(data) { 
  
    	var overlay = pickDrawing.renderImage('data:image/png;base64,' + data);

    	$( "#overlay-slider" ).slider({min: 0, max: 100, value:67, change: function( event, ui ) {
    		  overlay.animate({opacity: ui.value / 100});
      }});
    });

    var updateInterpNo = function(n){
      $('#interp-no').text(parseInt(n+1));
    };

    var updateVoteCount = function(voteCount){
        // Set the element text to the vote count
        if ($('#me-button').hasClass('active')){
          // Only need to do this once
          $('#my-vote-count').text(parseInt(voteCount["votes"]));
          $('#vote-count').text('–');
        } else if ($('#everyone-button').hasClass('active')){
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
          } // end of inner if
        } else {
          // User voted on the owner's interpretation
          $('#owner-vote-count').text(parseInt(voteCount["votes"]));
          $('#vote-count').text('–');
          // Update the button to reflect users current choice
          var user_choice = voteCount["user_choice"];
          document.getElementById("thumbs-up").style.color = "grey";
          document.getElementById("thumbs-down").style.color = "grey";
          if (user_choice == 1){
              document.getElementById("owner-thumbs-up").style.color = "green";
              document.getElementById("owner-thumbs-down").style.color = "grey";
          } else if (user_choice ==-1){
              document.getElementById("owner-thumbs-up").style.color = "grey";
              document.getElementById("owner-thumbs-down").style.color = "red";
          } else {
              document.getElementById("owner-thumbs-up").style.color = "grey";
              document.getElementById("owner-thumbs-down").style.color = "grey";
          } // end of inner if
        }
    };
   
    var loadPicks = function(user){
      server.get_votes( user, updateVoteCount);

      // This loads the picks for 'currentUser' who is not the 
      // currently-logged-in user, but the one in the pick
      // review cycle - the interpreter of the current pick.
      server.get_picks( user, function (data) {

        var convertToPoints = function(d) {
            var points = [];
            for (var i = 0; i < d.length; i++)
                points.push({x: d[i][0], y: d[i][1]});
            return points;
        };

        pickDrawing.clear();
        if (data.current) 
            pickDrawing.draw(convertToPoints(data.user_data), pickDrawing.colour.current);
        else if (data.owner)
            pickDrawing.draw(convertToPoints(data.owner_data), pickDrawing.colour.owner);
        else
            pickDrawing.draw(convertToPoints(data.data), pickDrawing.colour.default);
      });

      // Set the text in the delete interp button, and uncheck
      $('#interp-user').text(user);
      $('#delete-confirm').prop('checked', false);
    };

    $('#me-button').on('click', function(){
        // Toggles the user's own interpretation
        $(this).button('toggle');
        if ($(this).hasClass('active')){
          loadPicks(userID);
          $('#delete-confirm-div').addClass('disabled')
          $('#delete-confirm').prop('disabled', true).prop('checked', false);
          // $('#delete-interp').addClass('disabled');
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

          $('#delete-confirm-div').addClass('disabled')
          $('#delete-confirm').prop('disabled', true).prop('checked', false);
          // $('#delete-interp').addClass('disabled');
          $('#owner-up-vote-button').removeClass('disabled');
          $('#owner-down-vote-button').removeClass('disabled');
          $('#up-vote-button').addClass('disabled');
          $('#down-vote-button').addClass('disabled');
          $('#next-button').addClass('disabled');
          $('#previous-button').addClass('disabled');
          loadPicks(ownerUser);
        } else {
          pickDrawing.clear(); // Bah, deletes everything!
          $('#owner-up-vote-button').addClass('disabled');
          $('#owner-down-vote-button').addClass('disabled');
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

	    if(userCount > 0){

        // Turn off the other buttons
        if ($('#owner-button').hasClass('active')){
          $('#owner-button').button('toggle');
        }
        if ($('#me-button').hasClass('active')){
          $('#me-button').button('toggle');
        }

        $(this).button('toggle');

        if ($(this).hasClass('active')){

          // Turn everything on

          loadPicks(currentUser);
          $('#delete-confirm-div').removeClass('disabled');
          $('#delete-confirm').prop('disabled', false);
          // $('#delete-interp').removeClass('disabled');
          $('#owner-up-vote-button').addClass('disabled');
          $('#owner-down-vote-button').addClass('disabled');
          $('#up-vote-button').removeClass('disabled');
          $('#down-vote-button').removeClass('disabled');

          // Activate the previous and next buttons if
          // we already started stepping through
    	    if (userCount > 1 && current < (userCount - 1)) {
  		      $('#next-button').removeClass('disabled');
          } 
          if (userCount > 1 && current > 1) {
            $('#previous-button').removeClass('disabled');
          }

        } else {

          // Turn everything off
          
          pickDrawing.clear(); // Bah, deletes everything!
          $('#up-vote-button').addClass('disabled');
          $('#down-vote-button').addClass('disabled');
        }

	    }  // end if userCount > 0
    });

    $('#previous-button').on('click', function(){
      $('#next-button').removeClass('disabled');
      --current;
      if (current === 0){
        $('#previous-button').addClass('disabled');
      }
      currentUser = pickUsers[current];
      loadPicks(currentUser);
      updateInterpNo(current);
	
    });

    $('#next-button').on('click', function(){
        $('#previous-button').removeClass('disabled');

        ++current;
        if (current == (userCount - 1)){
          $('#next-button').addClass('disabled');
        }
        currentUser = pickUsers[current];
        loadPicks(currentUser);
        updateInterpNo(current);
    });
    
    var castVote = function(v, u){
      server.vote(u, v, updateVoteCount);
    };
    
    $('#up-vote-button').on('click', function(){
        castVote(1, currentUser);
    });

    $('#down-vote-button').on('click', function(){
        castVote(-1, currentUser);
    });
    
    $('#owner-up-vote-button').on('click', function(){
        castVote(1, ownerUser);
    });

    $('#owner-down-vote-button').on('click', function(){
        castVote(-1, ownerUser);
    });

    $('#delete-confirm').on('change', function() {
      console.log('on change')
      if($(this).is(':checked'))
        $('#delete-interp').removeClass('disabled')
      else 
        $('#delete-interp').addClass('disabled')
    })
    
    $('#delete-interp').on('click', function(){
      var q = 'image_key=' + image_key + '&user_id=' + currentUser;
      $.ajax({type:"DELETE",
              url:"/update_pick?" + q,
              dataType: "json",
              contentType: "application/json; charset=utf-8"
      })
      .done(function( data ) {
          console.log(data)
          $('#delete-ack').show("fast");
          $('#delete-ack').delay(2000, function() {
            location.reload();
          });
      });
    });
    


  loadPicks(userID);

});
