var pickrAPIService = function() {
    return {
    	delete: function(cb) {
	        $.ajax("/update_pick?clear=1&image_key=" + image_key, 
	        	{ type: "DELETE", success: cb });
	    },
    	remove_last_point: function(cb) {
        	$.ajax("/update_pick?undo=1&image_key=" + image_key,
        		{ type: "DELETE", dataType: "json", success: cb });
    	}
    };
};