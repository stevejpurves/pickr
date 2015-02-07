var pickrAPIService = function(im_key) {

	var image_key = im_key;

    return {
    	delete: function(cb) {
	        return $.ajax("/update_pick?clear=1&image_key=" + image_key, 
	        	{ type: "DELETE", success: cb });
	    },
    	remove_last_point: function(cb) {
        	return $.ajax("/update_pick?undo=1&image_key=" + image_key,
        		{ type: "DELETE", dataType: "json", success: cb });
    	},
    	update_pick: function(point, cb) {
        	return $.post('/update_pick', { x: point.x, y:point.y, image_key:image_key }, cb);
    	},
    	get_picks: function(user, cb) {
            return $.get('/update_pick?', { user:user, image_key: image_key }, cb, 'json');
        },
        get_votes: function(user, cb) {
        	return $.get('/vote', {user:user, image_key:image_key}, cb);
      	},
      	vote: function(user, vote, cb) {
         	return $.post('/vote',{ user: user, image_key: image_key, vote: vote }, cb);
        }
    };
};