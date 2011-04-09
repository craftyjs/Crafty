function initButtons() {

//on new game
$b.newgame.click(function() {
	Editor.alert("Start a new game?", "Starting a new game will lose all current work. Are you sure?", {
		"Cancel": function() {
			$(this).dialog("close");
		},
		
		"New Game": function() {
			$consoletext.html("");
			$(this).dialog("close");
		}
	});
});

//on running the game
$b.run.click(function() {
	$workbench.tabs('select', 2);
	Editor.run();
});

//on clearing the console
$b.clear.click(function() {
	$consoletext.html("");
});

//on creating a new component
$b.newent.click(function() {
	var comp, html = "";
	
	for(comp in COMPS) {
		html += "<option value='"+comp+"'>"+comp+"</option>";
	}
	$necomps.html(html);
	$nedialog.dialog({modal: true, buttons: {
		Cancel: function() { $(this).dialog("close"); },
		
		Create: function() {
			var inst = $instance.val().replace(/^[0-9]*/,"").replace(/[^A-Za-z0-9]/g, ""),
				comps = $necomps.val() || "",
				block;
			
			//name taken
			if(ENTS[inst] || !inst.length) {
				$instance.val("");
			} else {
				comps = typeof comps === "object" ? comps.join(", ") : "";
				block = new EntBlock("var "+inst+" = Crafty.e('"+comps+"');","",inst);
				block.comps = comps;
				
				CENTS[inst] = Crafty.e("_GUI").comps(comps);
				
				//append the entity in the selected scene
				CURRENT_SCENE.append(block);
				ENTS[inst] = block;
				Editor.update();
				
				$instance.val("");
				$(this).dialog("close");
			}
		}
	}});
});

$b.newscene.click(function() {
	$nsdialog.dialog({modal: true,
		buttons: {
			Cancel: function() { $(this).dialog("close"); },
			Create: function() {
				var name = $scname.val();
				SCENES[name] = new Block("Crafty.scene(\""+ name + "\", function() {", "});", name);
				CODE.append(SCENES[name]);
				Editor.update();
				
				$(this).dialog("close");
			}
		}
	});
});

$b.addasset.click(function() {
	$asdialog.dialog({modal: true,
		buttons: {
			Cancel: function() { $(this).dialog("close"); },
			Add: function() {
				var url = $asname.val(),
					ext = url.substr(url.lastIndexOf('.')+1).toLowerCase(),
					type;
				
				if(ext === 'wav' || ext === 'mp3' || ext === 'ogg' || ext === 'm4a') {
					type = "sound";
				} else if(ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'bmp') {
					type = "image";
				} else {
					return;
				}
				
				LOADER.assets.push(url);
				ASSETS[url] = {
					type: type
				};
				
				Editor.update();
				$(this).dialog("close");
			}
		}
	});
});

function openScene(e) {
	console.log(this);
	var href = $(this).attr("href");
	href = href.substr(1); //grab the scene ID
	
	CURRENT_SCENE = SCENES[href]; //make it current
	$("#scenes ul a").css("background", "transparent");
	$(this).css("background", "#FFE4D9"); //change the selected color
	$currentscene.text(CURRENT_SCENE.name);
}

//when clicking on a scene, select it
$("#scenes ul a").live("dblclick", openScene).contextMenu("sceneMenu", {
	open: openScene
});

function spritifyHandler() {
	var href = $(this).attr("href");
	href = href.substr(1); //grab the scene ID
	spritify(href);
}

$("#assets ul a.image").live("dblclick", spritifyHandler).contextMenu("imageMenu", {
	spritify: spritifyHandler
});

function playHandler() {
	var href = $(this).attr("href");
	href = href.substr(1); //grab the scene ID
	
}

$("#assets ul a.sound").live("dblclick", playHandler).contextMenu("soundMenu", {
	play: playHandler
});

$("#entities ul a").live("dblclick", function() {
	var href = $(this).attr("href");
	href = href.substr(1);
	
	CURRENT_ENTITY = ENTS[href];
	
	Editor.setCode();
}).contextMenu("entsMenu", {
	click: function() {
		var href = $(this).attr("href"), selected = $workbench.tabs("option", "selected");
		href = href.substr(1);
		
		//if an entity is selected, save the code
		if(selected === 1) {
			CURRENT_ENTITY.actions = CM.getCode();
		}
		
		CURRENT_ENTITY = ENTS[href];
		
		if(selected === 1) {
			Editor.setCode();
		}
		
		$("#entities ul a").css("background", "transparent");
		$(this).css("background", "#FFE4D9");
	},
	
	actions: function() {
		Editor.setCode();
	},
	
	properties: function() {
		$prdialog.dialog({modal: true, maxHeight:600, width:400,
			buttons: {
				Done: function() {
					//when done is clicked, update the .attr
					$prdialog.find("input").each(function() {
					
					});
					$(this).dialog("close");
				}
			}
		});
		
		var ent = CENTS[CURRENT_ENTITY.name], key, html = "";
		for(key in ent) {
			//no functions, private properties or properties starting with an int
			if(typeof ent[key] === "function" || key === "length" || 
			   key.charAt(0) === '_' || /^[0-9]+/.test(key)) continue;
			
			html += "<tr><th>"+key+":</th><td><input type='text' value='"+ent[key]+"' name='"+key+"'/></tr>";
		}
		//update the HTML
		$prdialog.find("table").html(html);
		
		//set change events for all the inputs
		$prdialog.find("input").change(function() {
			var name = $(this).attr("name"),
				val = $(this).val();
				
			ent[name] = guessType(val);
		});
	}
});

function cursor() {
	$workarea.css("cursor", CURSOR);
}

$b.pointer.mousedown(function() {
	CURSOR = "default";
	cursor();
});

$b.text.mousedown(function() {
	CURSOR = "text";
	cursor();
});

$b.spritebrush.mousedown(function() {
	CURSOR = "url('assets/images/paintbrush.png'), auto";
	cursor();
});

$b.scroll.mousedown(function() {
	CURSOR = "move";
	cursor();
});

$b.polygon.mousedown(function() {
	CURSOR = "crosshair";
	cursor();
});

}