var PickSelect = function(users, pickDrawing, loadPicks, getVotes) {
  var buttons = { me: null, owner: null, everyone: null }
  var userids = users;
  userids.currentPick = userids.viewer;

  var loadPicksCB = loadPicks;
  var getVotesCB = getVotes;

  buttons.me = new MeButton(userids.viewer);
  buttons.me.onToggleOn(function(id) {
    userids.currentPick = id
    loadPicksCB(id)
    getVotesCB(id, buttons.me.updateVoteCount )
    buttons.owner.deactivate()
    buttons.everyone.deactivate()
  })
  buttons.me.onToggleOff(function() {
    pickDrawing.clear()
  })
  if (userids.viewer)
    getVotesCB( userids.viewer, buttons.me.updateVoteCount )

  buttons.owner = new OwnerButton(userids.owner)
  buttons.owner.onToggleOn(function(id) {
    userids.currentPick = id
    loadPicksCB(id)
    getVotesCB( id, buttons.owner.updateVoteCount )
    buttons.me.deactivate()
    buttons.everyone.deactivate()
  })
  buttons.owner.onToggleOff(function() {
    pickDrawing.clear()
  })
  if (userids.owner)
    getVotesCB( userids.owner, buttons.owner.updateVoteCount )

  buttons.everyone = new EveryoneButton(userids.others)
  buttons.everyone.onToggleOn(function(id) {
      userids.currentPick = id
      loadPicksCB(id)
      getVotesCB( id, buttons.everyone.updateVoteCount )
      buttons.me.deactivate()
      buttons.owner.deactivate()
  })
  buttons.everyone.onToggleOff(function(id) {
      pickDrawing.clear()
  })
  if (userids.others.length > 0)
    getVotesCB( userids.others[0], buttons.everyone.updateVoteCount )

  this.getUserIdForCurrentPick = function() {
    return userids.currentPick;
  }
}

var MeButton = function(userid) {
  var viewersUserId = userid
  var toggleOn = null
  var toogleOff = null

  this.onToggleOn = function(cb) {
    toggleOn = function() { cb(viewersUserId) }
  }

  this.onToggleOff = function(cb) {
    toggleOff = cb
  }

  this.deactivate = function() {
    $('#me-button').removeClass('active')
  }

  this.updateVoteCount = function(voteCount) {
    $('#my-vote-count').text(parseInt(voteCount["votes"]));
  }

  $('#me-button').on('click', function() {
    if (viewersUserId) { // only if user has an interpration
      $(this).button('toggle')
      if ($(this).hasClass('active'))
        toggleOn()
      else {
        toggleOff()
        $(this).blur()
      }
    }
  })
}

var OwnerButton = function(userid) {
  var ownerUserId = userid;
  var toggleOn = null
  var toggleOff = null

  this.onToggleOn = function(cb) {
    toggleOn = function() { cb(ownerUserId) }
  }

  this.onToggleOff = function(cb) {
    toggleOff = cb
  }

  var activate = function() {
    $('#owner-up-vote-button').removeClass('disabled');
    $('#owner-down-vote-button').removeClass('disabled');
    $('#owner-button').addClass('active');
  }

  var deactivate = this.deactivate = function() {
    $('#owner-up-vote-button').addClass('disabled');
    $('#owner-down-vote-button').addClass('disabled');
    $('#owner-button').removeClass('active');
  }

  var updateVoteCount = this.updateVoteCount = function(voteCount) {
     $('#owner-vote-count').text(parseInt(voteCount["votes"]));
      var user_choice = voteCount["user_choice"];
      document.getElementById("owner-thumbs-up").style.color = "grey";
      document.getElementById("owner-thumbs-down").style.color = "grey";
      if (user_choice == 1)
          document.getElementById("owner-thumbs-up").style.color = "green";
      else if (user_choice == -1)
          document.getElementById("owner-thumbs-down").style.color = "red";
  }

  $('#owner-button').on('click', function(){
    if (ownerUserId) {
      $(this).button('toggle');
      if ($(this).hasClass('active')){
        toggleOn()
        activate()
      } else {
        toggleOff()
        deactivate()
        $(this).blur()
      }
    }
  })

  var server = pickrAPIService(image_key);

  $('#owner-up-vote-button').on('click', function(){
    server.vote(ownerUserId, 1, updateVoteCount);
  });

  $('#owner-down-vote-button').on('click', function(){
    server.vote(ownerUserId, -1, updateVoteCount);
  });
}

var EveryoneButton = function(useridList) {
  var listOfUserIds = useridList;
  var current = 0;
  var toggleOn = null;
  var toggleOff = null;

  this.onToggleOn = function(cb) {
    toggleOn = function() { cb(listOfUserIds[current]) }
  }

  this.onToggleOff = function(cb) {
    toggleOff = cb;
  }

  var activate = function() {
    $('#up-vote-button').removeClass('disabled')
    $('#down-vote-button').removeClass('disabled')
    $('#next-button').removeClass('disabled')
    $('#previous-button').removeClass('disabled')
    $('#everyone-button').addClass('active')
  }

  var deactivate = this.deactivate = function() {
    $('#up-vote-button').addClass('disabled')
    $('#down-vote-button').addClass('disabled')
    $('#next-button').addClass('disabled')
    $('#previous-button').addClass('disabled')
    $('#everyone-button').removeClass('active')
  }

  var updateVoteCount = this.updateVoteCount = function(voteCount) {
      $('#vote-count').text(parseInt(voteCount["votes"]));
      var user_choice = voteCount["user_choice"];
      document.getElementById("thumbs-up").style.color = "grey";
      document.getElementById("thumbs-down").style.color = "grey";
      if (user_choice == 1)
          document.getElementById("thumbs-up").style.color = "green";
      else if (user_choice ==-1)
          document.getElementById("thumbs-down").style.color = "red";
  }

  $('#everyone-button').on('click', function(){
    if(listOfUserIds.length > 0){
      $(this).button('toggle');
      if ($(this).hasClass('active')){
        toggleOn()
        activate()
        setNextPrevButtonState();
      } else {          
        toggleOff()
        deactivate()
        $(this).blur()
      }
    }
  })

  function setNextPrevButtonState() {
    if (listOfUserIds.length > 1) {
      if (current < (listOfUserIds.length - 1))
        $('#next-button').removeClass('disabled');
      else
        $('#next-button').addClass('disabled');
      if (current > 0)
        $('#previous-button').removeClass('disabled');
      else
        $('#previous-button').addClass('disabled');
    }
    else {
      $('#next-button').addClass('disabled');
      $('#previous-button').addClass('disabled');
    }
  }

  function updateOthersCurrentPick() {
    setNextPrevButtonState();
    toggleOn()
    $('#interp-no').text(parseInt(current+1));
  }

  $('#previous-button').on('click', function(){
    current--;
    updateOthersCurrentPick();
  });

  $('#next-button').on('click', function(){
    current++;
    updateOthersCurrentPick();
  });

  var server = pickrAPIService(image_key);

  $('#up-vote-button').on('click', function(){
    server.vote(listOfUserIds[current], 1, updateVoteCount);
  });

  $('#down-vote-button').on('click', function(){
    server.vote(listOfUserIds[current], -1, updateVoteCount);
  });
}