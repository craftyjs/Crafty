var elementToTypedValue = function (el) {
	if (el.getAttribute('data-type') == "number") {
		return parseFloat(el.value);
	} else {
		return el.value;
	}
}
var entityProps = function (e) {
	var comps = e.__c, vars = ko.observableArray([]);
	for (c in comps) {
		var props = Crafty.components()[c];
		for (p in props) {
			if (e[p] != null && typeof(e[p]) != "function" && typeof(e[p]) != "object") {
				// we should not modify these directly
				var name = ['_x', '_y', '_w', '_h', '_z', '_rotation', '_alpha'].indexOf(p) != -1 ? p.replace('_', '') : p;
				vars.push({ name: name, type: typeof(e[p]), value: e[p], id: e[0] });

			}
		}

	}
	return vars();
}

Crafty.bind('Load', function () {

	listEntities = function (filter) {
		var entities = [];
		//This is a number check in the scary world of JS
		isID = !isNaN(parseFloat(filter)) && isFinite(filter)
		// Save ids of single or many components.
		if (isID) {
			var e = Crafty(parseInt(filter));
			entities.push({ id: e[0], e: e });
			entitiesModel.filterCount(1);
		} else if (filter !== '*') {
			var ids = Crafty(filter), count = 0;
			entitiesModel.filterCount(ids.length);
			for (i in ids) {
				if (count++ > 50) break;
				if (!(!isNaN(parseFloat(i)) && isFinite(i))) continue;
				e = Crafty(ids[i]);
				entities.push({ id: e[0], e: e });
			}
		} else if (filter == '*') {
			var es = Crafty('*'), count = 0;
			entitiesModel.filterCount(es.length);
			for (en in es) {
				if (count++ > 50) break;
				e = es[en];
				entities.push({ id: e[0], e: e });
			}
		}
		return entities;
	};

	var entitiesModel = {
		filterCount: ko.observable(0),
		filter: ko.observable(""),
		showEntities: function () { this.filter("*"); },
		entityCount: ko.observable(0),
		pause: function () { Crafty.pause() },
		isPaused: ko.observable(false),
		fforward: function () { Crafty.timer.simulateFrames(1); },
		fforward10: function () { Crafty.timer.simulateFrames(10); },
		frame: ko.observable(0)
	};
	entitiesModel.entities = ko.dependentObservable(function () { return listEntities(this.filter()) }, entitiesModel)
	ko.applyBindings(entitiesModel);


	Crafty.bind("NewEntity", function () { entitiesModel.entityCount(Crafty("*").length) });
	Crafty.bind("Pause", function () { entitiesModel.isPaused(true); });
	Crafty.bind("Unpause", function () { entitiesModel.isPaused(false); });
	Crafty.bind("EnterFrame", function (e){ entitiesModel.frame(e.frame); });
});