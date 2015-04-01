var PickSelect = PickSelect || {}

PickSelect.userOfDisplayedPick = loggedInUser;
PickSelect.loadPicksCB = null;
PickSelect.buttons = { me: null, owner: null, everyone: null }

PickSelect.configure = function(userids, pickDrawing, loadPicks) {
  console.log("userOfDisplayedPick", userids)

  PickSelect.userids = userids;
  PickSelect.loadPicksCB = loadPicks;

  PickSelect.buttons.me = new MeButton(userids.viewer);
  PickSelect.buttons.me.onToggleOn(function(id) {
    PickSelect.userids.currentPick = id
    PickSelect.loadPicksCB(id)
    PickSelect.buttons.owner.deactivate()
    PickSelect.buttons.everyone.deactivate()
  })
  PickSelect.buttons.me.onToggleOff(function() {
    pickDrawing.clear()
  })

  PickSelect.buttons.owner = new OwnerButton(userids.owner)
  PickSelect.buttons.owner.onToggleOn(function(id) {
    PickSelect.userids.currentPick = id
    PickSelect.loadPicksCB(id)
    PickSelect.buttons.me.deactivate()
    PickSelect.buttons.everyone.deactivate()
  })
  PickSelect.buttons.owner.onToggleOff(function() {
    pickDrawing.clear()
  })

  PickSelect.buttons.everyone = new EveryoneButton(userids.others)
  PickSelect.buttons.everyone.onToggleOn(function(id) {
      PickSelect.userids.currentPick = id
      PickSelect.loadPicksCB(id)
      PickSelect.buttons.me.deactivate()
      PickSelect.buttons.owner.deactivate()
  })

  PickSelect.buttons.everyone.onToggleOff(function(id) {
      pickDrawing.clear()
  })
}

PickSelect.getUserIdForCurrentPick = function() {
  return PickSelect.userids.currentPick;
}

PickSelect.updateVoteCount = function(userid, voteCount) {
  if (userid == PickSelect.userids.viewer)
    PickSelect.buttons.me.updateVoteCount(voteCount)
  else if (userid == PickSelect.userids.owner)
    PickSelect.buttons.owner.updateVoteCount(voteCount)
  else
    PickSelect.buttons.everyone.updateVoteCount(voteCount)
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
      else
        toggleOff()
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
      }
    }
  })

  var server = pickrAPIService(image_key);

  $('#owner-up-vote-button').on('click', function(){
    server.vote(PickSelect.userids.owner, 1, updateVoteCount);
  });

  $('#owner-down-vote-button').on('click', function(){
    server.vote(PickSelect.userids.owner, -1, updateVoteCount);
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
    server.vote(PickSelect.userids.currentPick, 1, updateVoteCount);
  });

  $('#down-vote-button').on('click', function(){
    server.vote(PickSelect.userids.currentPick, -1, updateVoteCount);
  });
}