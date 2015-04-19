$(function() {

    // From results.html
    // =================
    // var interpretationCount = {{ count }}; 
    // var pickUsers = [];   // A list
    // var ownerUser = "{{ owner_user }}";
    // var loggedInUser = "{{ user_id }}";
    // var image_url = "{{ img_obj.url(size=1200) }}";
    // var image_key = "{{ img_obj.key().id() }}";
    // var baseImageWidth = "{{ img_obj.width }}";
    // var baseImageHeight = "{{ img_obj.height }}";
    // var pickstyle = "{{ img_obj.pickstyle }}";

    var server = pickrAPIService(image_key);
    var userids = { currentPick: loggedInUser || ownerUser || pickUsers[0],
                  viewer: loggedInUser,
                  owner: ownerUser,
                  others: pickUsers };

    pickDrawing.setup('image-div', 'rendering');

    function renderOverlay(overlayData) {
      var overlay = pickDrawing.renderOverlay('data:image/png;base64,' + overlayData);
      $( "#overlay-slider" ).slider({min: 0, max: 100, value:67, change: function( event, ui ) {
          overlay.animate({opacity: ui.value / 100});
      }});      
    }

    var polling_interval = 1000;
    function pollHeatmap() {
      server.get_heatmap(function(data) {
        if (data.stale) {
          $('#heatmap-notify').slideDown();
          return setTimeout(function(){ pollHeatmap() }, polling_interval);
        }
        renderOverlay(data.image)
        $('#heatmap-notify').slideUp();
        loadPicks(userids.currentPick)
      });  
    }

    // load existing heatmap immediately even if its stale
    if (overlay64) renderOverlay(overlay64)
    // poll for an updated heatmap
    pollHeatmap();

    var redrawPicks = function (data) {
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
      };

   
    var loadPicks = function(user){
      server.get_picks( user, redrawPicks);
      // Set the text in the delete interp button, and uncheck
      $('#interp-user').text(user);
      $('#delete-confirm').prop('checked', false);
    };

    var getVotes = function(user, cb) {
        server.get_votes( user, cb );
    }

    var pickSelect = new PickSelect(userids, pickDrawing, loadPicks, getVotes)    

    $('#delete-confirm').on('change', function() {
      if($(this).is(':checked'))
        $('#delete-interp').removeClass('disabled')
      else 
        $('#delete-interp').addClass('disabled')
    })
    
    $('#delete-interp').on('click', function(){
      server.delete_picks(pickSelect.getUserIdForCurrentPick(), function( data ) {
          $('#delete-ack').show("fast");
          $('#delete-ack').delay(2000, function() {
            location.reload();
          });
      });
    });

    $('#regenerate-heatmap').on('click', function() {
      server.regenerate_heatmap(pollHeatmap)
    })

  loadPicks(userids.currentPick);
});
