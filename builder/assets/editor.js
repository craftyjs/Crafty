$(function() {
	var $control = $("#control"),
		$workbench = $("#workbench"),
		$window = $(window),
		$layout = $("#layout"),
		$editor = $("#editor"),
		$stage = $("#stage");
		
	$control.tabs();
	$workbench.tabs();
	
	function fixHeight() {
		var height = $window.height();
		$layout.css("height", height - 60);
		$editor.css("height", height - 140);
		$stage.css("height", height - 140);
	}
	fixHeight();
	$window.bind('resize', fixHeight);
	
	//create a collection of jQuery objects for buttons
	var $b = {}, current, href;
	$("a").each(function() {
		current = $(this);
		href = current.attr("href").substr(1);
		$b[href] = current;
	});
	
	$b.newgame.click(function() {
		$editor.text("window.onload = function() {\r\n    Crafty.init(50)\r\n};");
	});
});