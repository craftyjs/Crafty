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
	$scenes,
	$components,
	$entities,
	$workarea,
	$consoletext,
	$frame,
	frame,
	CM,
	CRAFTY_SRC = "../crafty.js",
	LINT_OPTIONS = {evil: true, forin: true, sub: true, css: true, cap: true, on: true, fragment: true, es5: true, debug: true, browser: true},
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
	$scenes = $("#scenes");
	$components = $("#components");
	$entities = $("#entities");
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
		autoMatchParens: true,
		lineNumbers: true,
		tabMode: 'shift',
		enterMode: 'keep',
		electricChars: false,
		textWrapping: false,
		indentUnit: 4
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
				CM.setCode("window.onload = function() {\r\n\tCrafty.init(50);\r\n\r\n\tCrafty.scene(\"main\", function() {\r\n\t\t//your code here\r\n\t});\r\n};");
				$consoletext.html("");
				$(this).dialog("close");
				if(craft) Editor.detectObjects();
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
	var assets = [],
		scenes = [],
		ents = [],
		comps = {};
	
	return {
		detectObjects: function() {
			assets = [];
			scenes = [];
			
			var dupes = {},
				url,
				name,
				elems = craft.assets,
				lscenes = craft._scenes;
				
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
			
			//add scenes
			for(name in lscenes) {
				scenes.push(name);
			}
			
			//get all entities
			ents = craft('*');
			
			//get all components
			comps = craft.components();
			
			this.updateAssets();
			this.updateScenes();
			this.updateEntities();
			this.updateComponents();
		},
		
		updateAssets: function() {
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
		
		updateScenes: function() {
			var html = "",
				i = 0, l = scenes.length,
				current;
				
			for(;i<l;i++) {
				current = scenes[i];
				
				html += "<li><a href='#'><img src='assets/images/world.png'/> "+current+"</a></li>";
			}
			$scenes.find("ul").html(html);
		},
		
		updateEntities: function() {
			var html = "",
				i = 1, l = ents.length,
				comps = "",
				current;
				
			for(;i<=l;i++) {
				comps = "";
				current = ents[i];
				
				for(var comp in current.__c) comps += comp + ", ";
				comps = comps.substring(0, comps.length - 2);
				
				html += "<li><a href='#'><img src='assets/images/bullet.png'/> Ent #"+current[0]+" <b>"+ comps +"</b></a></li>";
			}
			$entities.find("ul").html(html);
		},
		
		updateComponents: function() {
			var html = "",
				current;
				
			for(comp in comps) {
				current = comps[comp];
				
				html += "<li><a href='#'><img src='assets/images/plugin.png'/> "+comp+" <b>"+ comps +"</b></a></li>";
			}
			$components.find("ul").html(html);
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
				html,
				win = frame.contentWindow,
				results = JSLINT(code, LINT_OPTIONS);
			
			//if found errors, log them
			if(!results) {
				var i = 0, errorz = JSLINT.errors, l = errorz.length, current;
				for(;i<l;i++) {
					current = errorz[i];
					if(!current) continue;
					this.log("Line <var>"+current.line+"</var> Char <var>"+current.character+"</var>: <code>"+current.evidence+"</code> ... "+current.reason);
				}
				if(errorz[l-1] == null) {
					$workbench.tabs('select', 0);
					return;
				}
			}
			
			html = ["<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\"><html><head>",
					"<scr"+"ipt"+" type='text/javascript' src='"+CRAFTY_SRC+"'></scr"+"ipt>",
					"<scr"+"ipt"+" type='text/javascript'>"+code+"</scr"+"ipt>",
					"</head><body style='margin:0;padding:0'></body></html>"];
						
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
		},
		
		log: function(msg) {
			$consoletext[0].innerHTML += "<small>"+msg+"</small>";
		}
	};
})();

window.Builder = Editor;

})(Crafty, window, jQuery);