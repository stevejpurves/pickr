var pickrAPIService = function() {
    return {
    	delete: function(cb) {
	        return $.ajax("/update_pick?clear=1&image_key=" + image_key, 
	        	{ type: "DELETE", success: cb });
	    },
    	remove_last_point: function(cb) {
        	return $.ajax("/update_pick?undo=1&image_key=" + image_key,
        		{ type: "DELETE", dataType: "json", success: cb });
    	},
    	update_pick: function(data, cb) {
        	return $.post('/update_pick', data, cb);
    	},
    	get_picks: function(parameters, cb) {
            return $.get('/update_pick?', parameters, cb, 'json');
        },
        get_votes: function(parameters, cb) {
        	return $.get('/vote', parameters, cb);
      	}
    };
};