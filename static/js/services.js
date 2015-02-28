var pickrAPIService = function(image_key) {

    return {
    	get_picks: function(user, cb) {
            return $.get('/update_pick?', { user:user, image_key: image_key }, cb, 'json');
        },
    	// update_pick: function(point, cb) {
     //    	return $.post('/update_pick', { x: point.x, y:point.y, image_key:image_key }, cb);
    	// },
    	send_picks: function(points, history, cb) {
    		return $.post('/update_pick', JSON.stringify({ points: points, image_key: image_key, history: history }), cb);
    	},
        get_votes: function(user, cb) {
        	return $.get('/vote', {user:user, image_key:image_key}, cb);
      	},
      	vote: function(user, vote, cb) {
         	return $.post('/vote',{ user: user, image_key: image_key, vote: vote }, cb);
        }
    };
};