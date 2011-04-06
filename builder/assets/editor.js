//(function(Crafty, window, $) {

var $b = {},
	glob = this,
	$window,
	CURRENT_ENTITY,
	CURRENT_SCENE,
	frame, //IFrame for preview
	CM, //CodeMirror
	CRAFTY_SRC = "../crafty.js",
	LINT_OPTIONS = {evil: true, forin: true, sub: true, css: true, cap: true, on: true, fragment: true, es5: true, debug: true, browser: true},
	craft,
	
	//array of Crafty objects
	COMPS = {},
	ENTS = {},
	CENTS = {},
	ASSETS = {},
	SCENES = {},
	
	CURSOR = "pointer",
	SETTINGS = {stage: [550, 440]};

function createHTMLElement(el) {
	if (document.createElementNS && document.documentElement.namespaceURI !== null)
	  return document.createElementNS("http://www.w3.org/1999/xhtml", el)
	else
	  return document.createElement(el)
}

function errorz(title, msg, buttons) {
	buttons = buttons || { Sorry: function() { $(this).dialog("close"); } };
	$error.attr("title", title).dialog({draggable: false, resizable: false, modal: true, buttons: buttons});
	$error.parent().children(":first").addClass("errorz");
	$error.find("div").html(msg);
}

function guessType(input) {
	var trimmed = input.replace(/^\s+|\s+$/g, ''),
		num = +trimmed;
	
	//if empty string
	if(trimmed.length === 0) return input;
	
	//Number
	if(!isNaN(num)) return num;
	
	//Boolean
	if(input === "true") return true;
	if(input === "false") return false;
	
	return input; //assume string
}
  
$(function() {
	//create a collection of jQuery objects for buttons
	var current, href, id;
	$("a").each(function() {
		current = $(this);
		href = current.attr("href")
		if(href) href = href.substr(1);
		$b[href] = current;
	});
	
	//create a collection of jQuery DIVs
	$("*").each(function() {
		id = $(this).attr("id");
		if(id) {
			id = '$' + id.replace(/-/g, "");
			glob[id] = $(this);
		}
	});
	
	$window = $(window);
	window.onbeforeunload = "Are you sure you want to leave?";
		
	CM = new CodeMirror(CodeMirror.replace($editor[0]), {
		height: '100%',
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
	
	$control.tabs();
	$workbench.tabs({
		show: function(e,ui) {
			calculate();
			console.log("LOAD", ui.index, CURRENT_ENTITY);
			//when the code tab has been selected
			if(ui.index === 1) {
				//if nothing has been selected, don't change views
				if(!CURRENT_ENTITY) {
					console.log("GO AWAY");
					$(this).tabs("select",0);
				} else {
					Editor.setCode();
				}
			} else {
				console.log(CM, CURRENT_ENTITY);
				if(CM && CURRENT_ENTITY) {
					console.log("SAVE CODE");
					CURRENT_ENTITY.actions = CM.getCode();
				}
			}
		}
	});
	
	//calculate heights
	function calculate() {
		var height = $window.height(), sw, sh;
			
		$editorcontainer.css("height", height - 320);
		$stage.css("height", height - 320);
		$workarea.css("height", height - 320);
		
		sw = $stage.width() - 6;
		sh = $stage.height();
		
		var dim = {"margin-left": ($workarea.width() / 2 - $area.width() / 2), "margin-top": ($workarea.height() / 2 - $area.height() / 2)};
		$area.css(dim);

	}
	calculate();
	$window.bind('resize', calculate);
	$workarea.bind("selectstart", function() { return false; });
	
	/**
	 * click handlers for UI buttons
	 */
	
	initButtons();
	
	SCENES.main = MAIN;
	COMPS = Crafty.components();
	Editor.update();
	
	//start Crafty
	Crafty.init(SETTINGS.stage[0], SETTINGS.stage[1]);
});


var Editor = (function() {
	
	return {
	
		update: function() {
			var i, ul, html = "", type;
			
			//list components
			for(i in COMPS) {
				html += "<li><a href='#"+i+"'><img src='assets/images/plugin.png'/> "+i+"</a></li>";
			}
			$components.find("ul").html(html);
			
			//list entities
			html = "";
			for(i in ENTS) {
				html += "<li><a href='#"+i+"'><img src='assets/images/bullet.png'/> "+i+" <b>"+ENTS[i].comps+"</b></a></li>";
			}
			$entities.find("ul").html(html);
			
			//list scenes
			html = "";
			for(i in SCENES) {
				html += "<li><a href='#"+i+"'><img src='assets/images/world.png'/> "+i+"</a></li>";
			}
			$scenes.find("ul").html(html);
			
			//list assets
			html = "";
			for(i in ASSETS) {
				type = ASSETS[i].type;
				html += "<li><a href='#"+i+"' class='"+type+"'><img src='assets/images/"+type+".png'/> "+i+"</a></li>";
			}
			$assets.find("ul").html(html);
		},
		
		setCode: function() {
			if(CURRENT_ENTITY) {
				CM.setCode(CURRENT_ENTITY.actions);
				$current.text(CURRENT_ENTITY.name);
				$workbench.tabs("select", 1);
			}
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
			}
		},
		
		alert: function dialog(title, msg, buttons) {
			$alert.attr("title", title).dialog({draggable: false, resizable: false, modal: true, buttons: buttons});
			$alerttext.text(msg);
		},
		
		log: function(msg) {
			$consoletext[0].innerHTML += "<small>"+msg+"</small>";
		}
	};
})();

window.Builder = Editor;

//})(Crafty, window, jQuery);