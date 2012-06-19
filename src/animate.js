Crafty.c("Animation", {
	_reel: null,

	init: function () {
		this._reel = {};
	},

	addAnimation: function (label, skeleton) {
		var key,
			lastKey = 0,
			i = 0, j,
			frame,
			prev,
			prop,
			diff = {},
			p,
			temp,
			frames = [];

		//loop over every frame
		for (key in skeleton) {

			frame = skeleton[key];
			prev = skeleton[lastKey] || this;
			diff = {};

			//find the difference
			for (prop in frame) {
				if (typeof frame[prop] !== "number") {
					diff[prop] = frame[prop];
					continue;
				}

				diff[prop] = (frame[prop] - prev[prop]) / (key - lastKey);
			}

			for (i = +lastKey + 1, j = 1; i <= +key; ++i, ++j) {
				temp = {};
				for (p in diff) {
					if (typeof diff[p] === "number") {
						temp[p] = prev[p] + diff[p] * j;
					} else {
						temp[p] = diff[p];
					}
				}

				frames[i] = temp;
			}
			lastKey = key;
		}

		this._reel[label] = frames;

		return this;
	},

	playAnimation: function (label) {
		var reel = this._reel[label],
			i = 0,
			l = reel.length,
			prop;

		this.bind("EnterFrame", function e() {
			for (prop in reel[i]) {
				this[prop] = reel[i][prop];
			}
			i++;

			if (i > l) {
				this.trigger("AnimationEnd");
				this.unbind("EnterFrame", e);
			}
		});
	}
});