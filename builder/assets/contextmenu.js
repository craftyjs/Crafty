(function($) {
	$.fn.contextMenu = function(id, callbacks) {
		
		function contextMenu(e) {
			if(callbacks.click) callbacks.click.call(this);
			
			//if button was RIGHT
			if(e.button === 2) {
				//grab element, show and move to mouse position
				var elem = $("#"+id).show().css({left: e.clientX, top: e.clientY}), 
					href, self = this;
				
				//element handler
				function handler(c) {
					c.stopPropagation(); //if clicked the menu, stop bubbling
				}
				
				//document handler
				function dhandle() {
					elem.unbind("click", handler).hide();
					$(this).unbind("click", dhandle);
				}
				
				//if a link is clicked, call the callback
				elem.find("a").click(function() {
					href = $(this).attr("href");
					if(href) href = href.substr(1);
					
					if(callbacks[href]) callbacks[href].call(self);	
					dhandle(); //close menu
				});
				
				elem.click(handler);
				$(document).click(dhandle);
			}
			
			return false;
		}
		$(this).live("click", contextMenu).live("contextmenu", contextMenu);
	};
})(jQuery);