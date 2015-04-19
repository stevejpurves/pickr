var pickrAPIService = function(image_key) {

    return {
    	get_picks: function(user, cb) {
            return $.get('/update_pick?', { user:user, image_key: image_key }, cb, 'json');
        },
    	send_picks: function(points, history, cb) {
    		return $.post('/update_pick', JSON.stringify({ points: points, image_key: image_key, history: history }), cb);
    	},
      delete_picks: function(user, cb) {
        var q = 'image_key=' + image_key + '&user_id=' + user;
        $.ajax({type:"DELETE",
                url:"/update_pick?" + q,
                dataType: "json",
                contentType: "application/json; charset=utf-8"
        }).done(cb);
      },
      get_votes: function(user, cb) {
      	return $.get('/vote', {user:user, image_key:image_key}, cb);
      },
      vote: function(user, vote, cb) {
       	return $.post('/vote',{ user: user, image_key: image_key, vote: vote }, cb);
      },
      get_heatmap: function(cb) {
        $.get('/heatmap?image_key=' + image_key).done(cb);
      },
      regenerate_heatmap: function(cb) {
        $.post('/heatmap?image_key=' + image_key).done(cb);
      }
    };
};