Crafty.bind('Load', function () {
	var statsPane = document.createElement("div");
	statsPane.className = "crafty_statsPane";
	document.body.appendChild(statsPane);
	var stats_ms = new xStats({ mode: 'ms' });
	statsPane.appendChild(stats_ms.element);
	var stats_fps = new xStats({ mode: 'fps' });
	statsPane.appendChild(stats_fps.element);
	var stats_mem = new xStats({ mode: 'mem' });
	statsPane.appendChild(stats_mem.element);
	var frameCounter = document.createElement("div");
	frameCounter.className = "crafty_frame_count";
	statsPane.appendChild(frameCounter);
	Crafty.bind("EnterFrame", function (e){ frameCounter.innerText = e.frame});


	var lastKey = "";
	var showEntitiesPane = false;
	var pannViewport = false;
	var showStatsPane = false;

	var rightPane = document.createElement("div");
	rightPane.className = "crafty_rightpane";
	var entityFilter = document.createElement("input");
	entityFilter.className = 'crafty_entity_filter';
	entityFilter.onkeypress = function (e) { if (Crafty.keydown[192] || Crafty.keydown[220]) return false; };
	rightPane.appendChild(entityFilter);
	var ents_list = document.createElement("div");
	ents_list.className = "crafty_ents_list";
	rightPane.appendChild(ents_list);
	document.body.appendChild(rightPane);



	var listEntities = function () {
		ents_list.innerHTML = "";
		filterValue = entityFilter.value;
		var ents = new Array();
		//This is a number check in the scary world of JS
		isID = !isNaN(parseFloat(filterValue)) && isFinite(filterValue)
		// Save ids of single or many components.
		if (isID) {
			ents.push(Crafty(parseInt(filterValue)));
		} else if (filterValue !== '*') {
			var ids = Crafty(filterValue), count = 0;
			for (i in ids) {
				if (count++ > 50) break;
				if (!(!isNaN(parseFloat(i)) && isFinite(i))) continue;
				ents.push(Crafty(ids[i]));
			}

		} else if (filterValue == '*') {
			var es = Crafty(filterValue), count = 0;
			for (e in es) {
				if (count++ > 50) break;
				ents.push(es[e]);
			}
		}

		for (var e in ents) {
			var entity = ents[e];
			if (isNaN(parseInt(e)) || !ents.hasOwnProperty(e)) continue;
			item = document.createElement("div");
			item.className = 'crafty_component_block';
			item.innerHTML += '<div class="crafty_component">' + ents[e][0] + '</div>';
			var comps = entity.__c;
			for (c in comps) {
				var props = Crafty.components()[c];
				for (p in props) {
					if (entity[p] != null && typeof(entity[p]) != "function" && typeof(entity[p]) != "object") {
						item.innerHTML += '<div class="crafty_prop"><span class="crafty_prop_name">' + (['_x', '_y', '_w', '_h', '_z', '_rotation', '_alpha'].indexOf(p) != -1 ? p.replace('_', '') : p)
						+ '</span><input data-type="' + typeof(entity[p]) + '" id="entity_' + ents[e][0] + '_' + p + '" onkeyup="Crafty(' + ents[e][0] + ').attr(\'' + (['_x', '_y', '_w', '_h', '_z', '_rotation', '_alpha'].indexOf(p) != -1 ? p.replace('_', '') : p) + '\', (document.getElementById(\'entity_' + ents[e][0] + '_' + p + '\').getAttribute(\'data-type\') == \'number\' ? parseFloat(document.getElementById(\'entity_' + ents[e][0] + '_' + p + '\').value) : document.getElementById(\'entity_' + ents[e][0] + '_' + p + '\').value))" class="crafty_prop_value" value="' + entity[p] + '" /></div>';
					}
				}
			}
			ents_list.appendChild(item);
		}
	};

	entityFilter.onkeyup = listEntities;

	Crafty.bind("KeyDown", function (e) {
		if (Crafty.keydown[192] || Crafty.keydown[220]) {
			if (e.key == Crafty.keys["1"]) {
				Crafty.pause();
			};
			if (e.key == Crafty.keys["2"]) {
				console.log("EF");
				Crafty.timer.simulateFrames(1);
			};
			if (e.key == Crafty.keys["3"]) {
				console.log("EF");
				Crafty.timer.simulateFrames(10);
			};
			if (e.key == Crafty.keys["4"]) {
				showEntitiesPane = !showEntitiesPane;
				if (!showEntitiesPane) {
					rightPane.style.display = 'none';
					entityFilter.blur();
				} else {
					rightPane.style.display = 'block';
					entityFilter.value = "*";
					listEntities();
					window.setTimeout(function () { entityFilter.focus(); entityFilter.select(); }, 200);
				}
			};
			if (e.key == Crafty.keys["5"]) {
				pannViewport = !pannViewport;
				Crafty.viewport.mouselook(pannViewport);
			};
			if (e.key == Crafty.keys["6"]) {
				showStatsPane = !showStatsPane;
				statsPane.style.display = (showStatsPane ? 'block' : 'none');
			};
		}
	});
});