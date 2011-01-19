(function(Crafty, window, $) {

//global jQuery objects
var $control,
	$workbench,
	$window,
	$layout,
	$editorcontainer,
	$editor,
	$stage,
	$dialog,
	$dialogtext,
	$console,
	$assets,
	$workarea,
	$consoletext;

$(function() {
	window.onbeforeunload = "Are you sure you want to leave?";
	
	//cache jQuery objects
	$control = $("#control"),
	$workbench = $("#workbench");
	$window = $(window);
	$layout = $("#layout");
	$editorcontainer = $("#editor-container");
	$editor = $("#editor");
	$stage = $("#stage");
	$dialog = $("#dialog");
	$dialogtext = $("#dialog-text");
	$console = $("#console");
	$assets = $("#assets");
	$consoletext = $("#console-text"),
	$workarea = $("#workarea");
		
	$control.tabs();
	$workbench.tabs({
		show: function() {
			console.log("test");
			fixHeight();
		}
	});
	
	//calculate heights
	function fixHeight() {
		var height = $window.height(),
			sw,
			sh;
			
		$editorcontainer.css("height", height - 290);
		$stage.css("height", height - 290);
		$workarea.css("height", height - 290);
		
		sw = $stage.width();
		sh = $stage.height()
		
		Crafty.window.width = sw;
		Crafty.window.height = sh;
		Crafty.viewport.width = sw;
		Crafty.viewport.height = sh;
		Crafty.canvas.width = sw;
		Crafty.canvas.height = sh;
		$("#cr-stage").css({width: sw, height: sh});
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
	
	//click handlers for UI buttons
	$b.newgame.click(function() {
		Editor.dialog("Start a new game?", "Starting a new game will lose all current work. Are you sure?", {
			"Cancel": function() {
				$(this).dialog("close");
			},
			
			"New Game": function() {
				$editor.html("window.onload = function() {\r\n    Crafty.init(50);\r\n};");
				$consoletext.html("");
				$(this).dialog("close");
			}
		});
	});
	
	$b.run.click(function() {
		Editor.run();
	});
	
	$b.clear.click(function() {
		$consoletext.html("");
	});
});


var Editor = (function() {
	var assets = [];
	
	return {
		detectObjects: function() {
			assets = [];
			var dupes = {},
				url,
				elems = Crafty.audio._elems;
				
			Crafty("sprite, image").each(function() {
				if(!dupes[this.__image]) dupes[this.__image] = true;
			});
			
			for(url in dupes) {
				assets.push({url: url, type: "image"});
			}
			
			for(url in elems) {
				assets.push({url: elems[url].src, type: "sound"});
			}
			
			this.update();
		},
		
		update: function() {
			var html = "",
				i = 0, l = assets.length,
				current,
				file;
				
			for(;i<l;i++) {
				current = assets[i];
				file = current.url.substr(current.url.lastIndexOf('/')+1);
				html += "<li><a href='#' title='"+current.url+"'><img src='assets/images/"+current.type+".png'/> "+file+"</a></li>";
			}
			$assets.find("ul").html(html);
		},
		
		run: function run() {
			var code = $editor.val();
			try {
				Crafty.stop();
				eval(code);
				window.onload();
				Editor.detectObjects();
				
				$("#stage").append($("#cr-stage")[0]);

			} catch(e) {
				$consoletext[0].innerHTML += "<small>"+e+"</small>";
			}
		},
		
		dialog: function dialog(title, msg, buttons) {
			$dialog.attr("title", title).dialog({draggable: false, resizable: false, modal: true, buttons: buttons});
			$dialogtext.text(msg);
		}
	};
})();
	
})(Crafty, window, jQuery);