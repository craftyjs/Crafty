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
	$consoletext,
	$frame,
	frame,
	CM,
	CRAFTY_SRC = "../crafty.js",
	craft;

function createHTMLElement(el) {
	if (document.createElementNS && document.documentElement.namespaceURI !== null)
	  return document.createElementNS("http://www.w3.org/1999/xhtml", el)
	else
	  return document.createElement(el)
}
  
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
			fixHeight();
		}
	});
	
	CM = new CodeMirror(CodeMirror.replace($editor[0]), {
		height: '100%',
		content: $editor.val(),
		parserfile: ["tokenizejavascript.js", "parsejavascript.js"],
		stylesheet: "codemirror/css/jscolors.css",
		path: "codemirror/js/",
		autoMatchParens: true
	});
	
	//calculate heights
	function fixHeight() {
		var height = $window.height(),
			sw,
			sh;
			
		$editorcontainer.css("height", height - 290);
		$stage.css("height", height - 290);
		$workarea.css("height", height - 290);
		
		sw = $stage.width() - 6;
		sh = $stage.height();
		
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
				CM.setCode("window.onload = function() {\r\n\tCrafty.init(50);\r\n};");
				$consoletext.html("");
				$(this).dialog("close");
			}
		});
	});
	
	$b.run.click(function() {
		$workbench.tabs('select', 2);
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
				elems = craft.assets;
				
			craft("sprite, image").each(function() {
				if(!dupes[this.__image]) dupes[this.__image] = true;
			});
			
			for(url in dupes) {
				assets.push({url: url, type: "image"});
			}
			
			for(url in elems) {
				if(dupes[url]) continue;
				
				var ext = url.substr(url.lastIndexOf('.')+1).toLowerCase(),
					type;
					
				if(ext === "mp3" || ext === "wav" || ext === "ogg" || ext === "mp4") {
					type = "sound";
				} else if(ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "png") {
					type = "image";
				} else continue;
				
				assets.push({url: url, type: type});
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
			//if iframe exists, remove it and create a new one
			if(frame) $stage[0].removeChild(frame);
			frame = createHTMLElement("iframe");
			frame.src = "javascript:;";
			frame.frameBorder = 0;
			frame.style.border = "0";
			frame.style.width = '100%';
			frame.style.height = '100%';
			frame.style.display = "block";
			
			//add it to the stage div
			$stage.append(frame);
			$(frame).load(handler);
			
			//generate the HTML for the frame
			var code = CM.getCode(),
				html = ["<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\"><html><head>",
						"<scr"+"ipt"+" type='text/javascript' src='"+CRAFTY_SRC+"'></scr"+"ipt>",
						"<scr"+"ipt"+" type='text/javascript'>"+code+"</scr"+"ipt>",
						"</head><body style='margin:0;padding:0'></body></html>"],
				win = frame.contentWindow;
				
			//add the HTML
			win.document.open();
			win.document.write(html.join(""));
			win.document.close();
			
			//when loaded, grab the Crafty instance
			function handler() {
				craft = win.Crafty;
				Editor.detectObjects();	
			}
		},
		
		dialog: function dialog(title, msg, buttons) {
			$dialog.attr("title", title).dialog({draggable: false, resizable: false, modal: true, buttons: buttons});
			$dialogtext.text(msg);
		}
	};
})();
	
})(Crafty, window, jQuery);
