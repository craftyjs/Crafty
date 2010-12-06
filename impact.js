// Built with IMPACT - impactjs.org
Number.prototype.map = function (istart, istop, ostart, ostop) {
    return ostart + (ostop - ostart) * ((this - istart) / (istop - istart));
};
Number.prototype.limit = function (min, max) {
    return Math.min(max, Math.max(min, this));
};
Number.prototype.round = function (precision) {
    precision = Math.pow(10, precision || 0);
    return Math.round(this * precision) / precision;
};
Number.prototype.floor = function () {
    return Math.floor(this);
};
Number.prototype.ceil = function () {
    return Math.ceil(this);
};
Array.prototype.erase = function (item) {
    for (var i = this.length; i--; i) {
        if (this[i] === item) this.splice(i, 1);
    }
    return this;
};
Array.prototype.random = function () {
    return this[(Math.random() * this.length).floor()];
};
Function.prototype.bind = function (bind) {
    var self = this;
    return function () {
        var args = Array.prototype.slice.call(arguments);
        return self.apply(bind || null, args);
    };
};
(function (window) {
    window.ig = {
        version: 0.9,
        global: window,
        modules: {},
        resources: [],
        ready: false,
        nocache: '',
        _current: null,
        _loadQueue: [],
        _inExec: false,
        $: function (selector) {
            return selector.charAt(0) == '#' ? document.getElementById(selector.substr(1)) : document.getElementsByTagName(selector);
        },
        $new: function (name) {
            return document.createElement(name);
        },
        copy: function (object) {
            if (!object || typeof(object) != 'object' || object instanceof ig.Class) {
                return object;
            }
            else if (object instanceof Array) {
                var c = [];
                for (var i = 0, l = object.length; i < l; i++) {
                    c[i] = this.copy(object[i]);
                }
                return c;
            }
            else {
                var c = {};
                for (var i in object) {
                    c[i] = this.copy(object[i]);
                }
                return c;
            }
        },
        merge: function (original, extended) {
            for (var key in extended) {
                if (typeof(extended[key]) == 'object') {
                    if (!original[key] || typeof(original[key]) != 'object') {
                        original[key] = {};
                    }
                    this.merge(original[key], extended[key]);
                }
                else {
                    original[key] = extended[key];
                }
            }
            return original;
        },
        ksort: function (obj) {
            if (!obj || typeof(obj) != 'object') {
                return [];
            }
            var keys = [],
                values = [];
            for (var i in obj) {
                keys.push(i);
            }
            keys.sort();
            for (var i = 0; i < keys.length; i++) {
                values.push(obj[keys[i]]);
            }
            return values;
        },
        module: function (name) {
            if (this._current) {
                throw ("Module '" + this._current.name + "' defines nothing");
            }
            this._current = {
                name: name,
                requires: [],
                loaded: false,
                body: null
            };
            this.modules[name] = this._current;
            this._loadQueue.push(this._current);
            this._initDOMReady();
            return ig;
        },
        requires: function () {
            this._current.requires = Array.prototype.slice.call(arguments);
            return ig;
        },
        defines: function (body) {
            this._current.body = body;
            this._current = null;
            this._execModules();
        },
        addResource: function (resource) {
            this.resources.push(resource);
        },
        _loadScript: function (name) {
            ig.modules[name] = {
                name: name,
                requires: [],
                loaded: false,
                body: null
            };
            var path = 'lib/' + name.replace(/\./g, '/') + '.js' + ig.nocache;
            var script = ig.$new('script');
            script.type = 'text/javascript';
            script.src = path;
            script.onload = ig._execModules.bind(this);
            script.onerror = function () {
                throw ("Failed to load required module '" + name + "' at " + path);
            }
            ig.$('head')[0].appendChild(script);
        },
        _execModules: function () {
            if (ig._inExec) return;
            var modulesLoaded = false;
            for (var i = 0; i < this._loadQueue.length; i++) {
                var m = this._loadQueue[i];
                var dependenciesLoaded = true;
                for (var j = 0; j < m.requires.length; j++) {
                    var name = m.requires[j];
                    if (!this.modules[name]) {
                        dependenciesLoaded = false;
                        this._loadScript(name);
                    }
                    else if (!this.modules[name].loaded) {
                        dependenciesLoaded = false;
                    }
                }
                if (dependenciesLoaded && m.body) {
                    ig._inExec = true;
                    this._loadQueue.splice(i, 1);
                    m.loaded = true;
                    m.body();
                    modulesLoaded = true;
                    i--;
                }
            }
            ig._inExec = false;
            if (modulesLoaded) {
                this._execModules();
            }
        },
        _DOMReady: function () {
            if (!ig.modules['dom.ready'].loaded) {
                if (!document.body) {
                    return setTimeout(ig._ready, 13);
                }
                ig.modules['dom.ready'].loaded = true;
                ig._execModules();
            }
            return 0;
        },
        _initDOMReady: function () {
            if (ig.modules['dom.ready']) {
                return;
            }
            if (document.location.href.match(/\?nocache/)) {
                ig.nocache = '?' + Math.random().toString().substr(2);
            }
            ig.modules['dom.ready'] = {
                requires: [],
                loaded: false,
                body: null
            };
            if (document.readyState === 'complete') {
                ig._DOMReady();
            }
            else {
                document.addEventListener('DOMContentLoaded', ig._DOMReady, false);
                window.addEventListener('load', ig._DOMReady, false);
            }
        },
    };
    var initializing = false,
        fnTest = /xyz/.test(function () {
            xyz;
        }) ? /\bparent\b/ : /.*/;
    window.ig.Class = function () {};
    window.ig.Class.extend = function (prop) {
        var parent = this.prototype;
        initializing = true;
        var prototype = new this();
        initializing = false;
        for (var name in prop) {
            if (typeof(prop[name]) == "function" && typeof(parent[name]) == "function" && fnTest.test(prop[name])) {
                prototype[name] = (function (name, fn) {
                    return function () {
                        var tmp = this.parent;
                        this.parent = parent[name];
                        var ret = fn.apply(this, arguments);
                        this.parent = tmp;
                        return ret;
                    };
                })(name, prop[name])
            }
            else {
                prototype[name] = prop[name];
            }
        }

        function Class() {
            if (!initializing) {
                if (this.staticInstantiate) {
                    var obj = this.staticInstantiate.apply(this, arguments);
                    if (obj) {
                        return obj;
                    }
                }
                for (p in this) {
                    this[p] = ig.copy(this[p]);
                }
                if (this.init) {
                    this.init.apply(this, arguments);
                }
            }
            return this;
        }
        Class.prototype = prototype;
        Class.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };
})(window);

// impact/image.js
ig.module('impact.image').defines(function () {
    ig.Image = ig.Class.extend({
        data: null,
        width: 0,
        height: 0,
        loaded: false,
        failed: false,
        loadCallback: null,
        path: '',
        staticInstantiate: function (path) {
            return ig.Image.cache[path] || null;
        },
        init: function (path) {
            this.path = path;
            this.load();
        },
        load: function (loadCallback) {
            if (this.loaded && loadCallback) {
                loadCallback(this.path, true);
                return;
            }
            else if (!this.loaded && ig.ready) {
                this.loadCallback = loadCallback || null;
                this.data = new Image();
                this.data.onload = this.onload.bind(this);
                this.data.onerror = this.onerror.bind(this);
                this.data.src = this.path + ig.nocache;
            }
            else {
                ig.addResource(this);
            }
            ig.Image.cache[this.path] = this;
        },
        reload: function () {
            this.loaded = false;
            this.data = new Image();
            this.data.onload = this.onload.bind(this);
            this.data.src = this.path + '?' + Math.random();
        },
        onload: function (event) {
            this.width = this.data.width;
            this.height = this.data.height;
            if (ig.system.scale != 1) {
                this.resize(ig.system.scale);
            }
            this.loaded = true;
            if (this.loadCallback) {
                this.loadCallback(this.path, true);
            }
        },
        onerror: function (event) {
            this.failed = true;
            if (this.loadCallback) {
                this.loadCallback(this.path, false);
            }
        },
        resize: function (scale) {
            var widthScaled = this.width * scale;
            var heightScaled = this.height * scale;
            var orig = ig.$new('canvas');
            orig.width = this.width;
            orig.height = this.height;
            var origCtx = orig.getContext('2d');
            origCtx.drawImage(this.data, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
            var origPixels = origCtx.getImageData(0, 0, this.width, this.height);
            var scaled = ig.$new('canvas');
            scaled.width = widthScaled;
            scaled.height = heightScaled;
            var scaledCtx = scaled.getContext('2d');
            var scaledPixels = scaledCtx.getImageData(0, 0, widthScaled, heightScaled);
            for (var y = 0; y < heightScaled; y++) {
                for (var x = 0; x < widthScaled; x++) {
                    var index = (Math.floor(y / scale) * this.width + Math.floor(x / scale)) * 4;
                    var indexScaled = (y * widthScaled + x) * 4;
                    scaledPixels.data[indexScaled] = origPixels.data[index];
                    scaledPixels.data[indexScaled + 1] = origPixels.data[index + 1];
                    scaledPixels.data[indexScaled + 2] = origPixels.data[index + 2];
                    scaledPixels.data[indexScaled + 3] = origPixels.data[index + 3];
                }
            }
            scaledCtx.putImageData(scaledPixels, 0, 0);
            this.data = scaled;
        },
        draw: function (targetX, targetY, sourceX, sourceY, width, height) {
            if (!this.loaded) {
                return;
            }
            var scale = ig.system.scale;
            sourceX = sourceX ? sourceX * scale : 0;
            sourceY = sourceY ? sourceY * scale : 0;
            width = (width ? width : this.width) * scale;
            height = (height ? height : this.height) * scale;
            ig.system.context.drawImage(this.data, sourceX, sourceY, width, height, ig.system.getDrawPos(targetX), ig.system.getDrawPos(targetY), width, height);
        },
        drawTile: function (targetX, targetY, tile, tileWidth, tileHeight, flipX, flipY) {
            tileHeight = tileHeight ? tileHeight : tileWidth;
            if (!this.loaded || tileWidth > this.width || tileHeight > this.height) {
                return;
            }
            var scale = ig.system.scale;
            var tileWidthScaled = tileWidth * scale;
            var tileHeightScaled = tileHeight * scale;
            var scaleX = flipX ? -1 : 1;
            var scaleY = flipY ? -1 : 1;
            if (flipX || flipY) {
                ig.system.context.save();
                ig.system.context.scale(scaleX, scaleY);
            }
            ig.system.context.drawImage(this.data, (Math.floor(tile * tileWidth) % this.width) * scale, (Math.floor(tile * tileWidth / this.width) * tileHeight) * scale, tileWidthScaled, tileHeightScaled, ig.system.getDrawPos(targetX) * scaleX - (flipX ? tileWidthScaled : 0), ig.system.getDrawPos(targetY) * scaleY - (flipY ? tileHeightScaled : 0), tileWidthScaled, tileHeightScaled);
            if (flipX || flipY) {
                ig.system.context.restore();
            }
        }
    });
    ig.Image.cache = {};
    ig.Image.reloadCache = function () {
        for (path in ig.Image.cache) {
            ig.Image.cache[path].reload();
        }
    };
});

// impact/font.js
ig.module('impact.font').requires('impact.image').defines(function () {
    ig.Font = ig.Image.extend({
        widthMap: [],
        indices: [],
        firstChar: 32,
        onload: function (event) {
            this._loadMetrics(this.data);
            this.parent(event);
        },
        draw: function (text, x, y, align) {
            if (align == ig.Font.ALIGN.RIGHT || align == ig.Font.ALIGN.CENTER) {
                var width = 0;
                for (var i = 0; i < text.length; i++) {
                    var c = text.charCodeAt(i);
                    width += this.widthMap[c - this.firstChar] + 1;
                }
                x -= align == ig.Font.ALIGN.CENTER ? width / 2 : width;
            }
            for (var i = 0; i < text.length; i++) {
                var c = text.charCodeAt(i);
                x += this._drawChar(c - this.firstChar, x, y);
            }
        },
        _drawChar: function (c, targetX, targetY) {
            if (!this.loaded || c < 0 || c >= this.indices.length) {
                return 0;
            }
            var scale = ig.system.scale;
            var charX = this.indices[c] * scale;
            var charY = 0;
            var charWidth = this.widthMap[c] * scale;
            var charHeight = (this.height - 2) * scale;
            ig.system.context.drawImage(this.data, charX, charY, charWidth, charHeight, ig.system.getDrawPos(targetX), ig.system.getDrawPos(targetY), charWidth, charHeight);
            return this.widthMap[c] + 1;
        },
        _loadMetrics: function (image) {
            this.widthMap = [];
            this.indices = [];
            var s = ig.system.scale;
            var canvas = ig.$new('canvas');
            canvas.width = image.width;
            canvas.height = 1;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, image.height - 1, image.width, 1, 0, 0, image.width, 1);
            var px = ctx.getImageData(0, 0, image.width, 1);
            var currentChar = 0;
            var currentWidth = 0;
            for (var x = 0; x < image.width; x++) {
                var index = x * 4 + 3;
                if (px.data[index] != 0) {
                    currentWidth++;
                }
                else if (px.data[index] == 0 && currentWidth) {
                    this.widthMap.push(currentWidth);
                    this.indices.push(x - currentWidth);
                    currentChar++;
                    currentWidth = 0;
                }
            }
            this.widthMap.push(currentWidth);
            this.indices.push(x - currentWidth);
        }
    });
    ig.Font.ALIGN = {
        LEFT: 0,
        RIGHT: 1,
        CENTER: 2
    };
});

// impact/sound.js
ig.module('impact.sound').defines(function () {
    ig.SoundManager = ig.Class.extend({
        clips: {},
        cache: [],
        volume: 1,
        channels: 4,
        format: 'mp3',
        init: function () {
            this.format = ig.$new('audio').canPlayType('audio/mpeg') ? 'mp3' : 'ogg';
        },
        load: function (path, multiChannel, loadCallback) {
            if (this.clips[path]) {
                if (multiChannel && this.clips[path].length < this.channels) {
                    for (var i = this.clips[path].length; i < this.channels; i++) {
                        this.clips[path].push(this.clips[path][0].cloneNode(true));
                    }
                }
                return this.clips[path][0];
            }
            var realPath = path.match(/^(.*)\.\w+$/)[1] + '.' + this.format + ig.nocache;
            var clip = ig.$new('audio');
            if (loadCallback) {
                clip.addEventListener('canplaythrough', function (ev) {
                    this.removeEventListener('canplaythrough', arguments.callee, false)
                    loadCallback(path, true);
                }, false);
                clip.addEventListener("error", function (ev) {
                    loadCallback(path, true);
                }, false);
            }
            clip.autobuffer = true;
            clip.preload = 'auto';
            clip.src = realPath;
            clip.load();
            this.clips[path] = [clip];
            if (multiChannel) {
                for (var i = 1; i < this.channels; i++) {
                    this.clips[path].push(clip.cloneNode(true));
                }
            }
            return clip;
        },
        get: function (path) {
            var channels = this.clips[path];
            for (var i = 0, clip; clip = channels[i++];) {
                if (clip.paused || clip.ended) {
                    if (clip.ended) {
                        clip.currentTime = 0;
                    }
                    return clip;
                }
            }
            channels[0].pause();
            channels[0].currentTime = 0;
            return channels[0];
        },
        getVolume: function () {
            return this.volume;
        },
        setVolume: function (v) {
            this.volume = v;
            for (var i in this.tracks) {
                this.tracks[i].volume = v;
            }
        }
    });
    ig.Music = ig.Class.extend({
        tracks: [],
        currentTrack: null,
        currentIndex: 0,
        random: false,
        volume: 1,
        _loop: true,
        _fadeInterval: 0,
        _fadeTimer: null,
        _endedCallbackBound: null,
        init: function () {
            this._endedCallbackBound = this._endedCallback.bind(this);
        },
        add: function (music) {
            var path = music instanceof ig.Sound ? music.path : music;
            var track = ig.soundManager.load(path, false);
            track.loop = this._loop;
            track.volume = this.volume;
            track.addEventListener('ended', this._endedCallbackBound, false);
            this.tracks.push(track);
            if (!this.currentTrack) {
                this.currentTrack = track;
            }
        },
        next: function () {
            if (!this.tracks.length) {
                return;
            }
            this.stop();
            this.currentIndex = this.random ? (Math.random() * this.tracks.length).floor() : (this.currentIndex + 1) % this.tracks.length;
            this.currentTrack = this.tracks[this.currentIndex];
            this.play();
        },
        pause: function () {
            if (!this.currentTrack) {
                return;
            }
            this.currentTrack.pause();
        },
        stop: function () {
            if (!this.currentTrack) {
                return;
            }
            this.currentTrack.pause();
            this.currentTrack.currentTime = 0;
        },
        play: function () {
            if (!this.currentTrack) {
                return;
            }
            this.currentTrack.play();
        },
        getLooping: function () {
            return this._loop;
        },
        setLooping: function (l) {
            this._loop = l;
            for (var i in this.tracks) {
                this.tracks[i].loop = l;
            }
        },
        getVolume: function () {
            return this.volume;
        },
        setVolume: function (v) {
            this.volume = v.limit(0, 1);
            for (var i in this.tracks) {
                this.tracks[i].volume = v;
            }
        },
        fadeOut: function (time) {
            if (!this.currentTrack) {
                return;
            }
            clearInterval(this._fadeInterval);
            this.fadeTimer = new ig.Timer(time);
            this._fadeInterval = setInterval(this._fadeStep.bind(this), 50);
        },
        _fadeStep: function () {
            var v = this.fadeTimer.delta().map(-this.fadeTimer.target, 0, 1, 0).limit(0, 1) * this.volume;
            if (v <= 0.01) {
                this.stop();
                this.currentTrack.volume = this.volume;
                clearInterval(this._fadeInterval);
            }
            else {
                this.currentTrack.volume = v;
            }
        },
        _endedCallback: function () {
            if (this._loop) {
                this.play();
            }
            else {
                this.next();
            }
        }
    });
    ig.Sound = ig.Class.extend({
        path: '',
        volume: 1,
        currentClip: null,
        multiChannel: true,
        init: function (path, multiChannel) {
            this.path = path;
            this.multiChannel = (multiChannel !== false);
            this.load();
        },
        load: function (loadCallback) {
            if (ig.ready) {
                ig.soundManager.load(this.path, this.multiChannel, loadCallback);
            }
            else {
                ig.addResource(this);
            }
        },
        play: function () {
            this.currentClip = ig.soundManager.get(this.path);
            this.currentClip.volume = ig.soundManager.volume * this.volume;
            this.currentClip.play();
        },
        stop: function () {
            if (this.currentClip) {
                this.currentClip.pause();
                this.currentClip.currentTime = 0;
            }
        }
    });
});

// impact/loader.js
ig.module('impact.loader').requires('impact.image', 'impact.font', 'impact.sound').defines(function () {
    ig.Loader = ig.Class.extend({
        resources: [],
        gameClass: null,
        status: 0,
        done: false,
        _unloaded: [],
        _drawStatus: 0,
        _intervalId: 0,
        _loadCallbackBound: null,
        init: function (gameClass, resources) {
            this.gameClass = gameClass;
            this.resources = resources;
            this._loadCallbackBound = this._loadCallback.bind(this);
            for (var i = 0; i < this.resources.length; i++) {
                this._unloaded.push(this.resources[i].path);
            }
        },
        load: function () {
            if (!this.resources.length) {
                this.end();
                return;
            }
            ig.system.clear('#000');
            for (var i = 0; i < this.resources.length; i++) {
                this.loadResource(this.resources[i]);
            }
            this._intervalId = setInterval(this.draw.bind(this), 16);
        },
        loadResource: function (res) {
            res.load(this._loadCallbackBound);
        },
        end: function () {
            if (this.done) {
                return;
            }
            this.done = true;
            clearInterval(this._intervalId);
            ig.system.setGame(this.gameClass);
        },
        draw: function () {
            this._drawStatus += (this.status - this._drawStatus) / 5;
            var s = ig.system.scale;
            var w = ig.system.width * 0.6;
            var h = ig.system.height * 0.1;
            var x = ig.system.width * 0.5 - w / 2;
            var y = ig.system.height * 0.5 - h / 2;
            ig.system.context.fillStyle = '#000';
            ig.system.context.fillRect(0, 0, 480, 320);
            ig.system.context.fillStyle = '#fff';
            ig.system.context.fillRect(x * s, y * s, w * s, h * s);
            ig.system.context.fillStyle = '#000';
            ig.system.context.fillRect(x * s + s, y * s + s, w * s - s - s, h * s - s - s);
            ig.system.context.fillStyle = '#fff';
            ig.system.context.fillRect(x * s, y * s, w * s * this._drawStatus, h * s);
        },
        _loadCallback: function (path, status) {
            if (status) {
                this._unloaded.erase(path);
            }
            else {
                throw ('Failed to load resource: ' + path);
            }
            this.status = 1 - (this._unloaded.length / this.resources.length);
            if (this._unloaded.length == 0) {
                setTimeout(this.end.bind(this), 250);
            }
        }
    });
});

// impact/timer.js
ig.module('impact.timer').defines(function () {
    ig.Timer = ig.Class.extend({
        target: 0,
        base: 0,
        last: 0,
        init: function (seconds) {
            this.base = ig.Timer.time;
            this.last = ig.Timer.time;
            this.target = seconds || 0;
        },
        set: function (seconds) {
            this.target = seconds;
            this.base = ig.Timer.time;
        },
        reset: function () {
            this.base = ig.Timer.time;
        },
        tick: function () {
            var delta = ig.Timer.time - this.last;
            this.last = ig.Timer.time;
            return delta;
        },
        delta: function () {
            return ig.Timer.time - this.base - this.target;
        }
    });
    ig.Timer._last = 0;
    ig.Timer.time = 0;
    ig.Timer.timescale = 1;
    ig.Timer.step = function (min, max) {
        var current = Date.now();
        ig.Timer.time += ((current - ig.Timer._last) / 1000).limit(min, max) * ig.Timer.timescale;
        ig.Timer._last = current;
    };
});

// impact/system.js
ig.module('impact.system').requires('impact.timer', 'impact.image').defines(function () {
    ig.System = ig.Class.extend({
        fps: 30,
        width: 320,
        height: 240,
        realWidth: 320,
        realHeight: 240,
        scale: 1,
        tick: 0,
        time: 0,
        intervalId: 0,
        delegate: null,
        clock: null,
        canvas: null,
        context: null,
        smoothPositioning: true,
        init: function (canvasId, fps, width, height, scale) {
            this.fps = fps;
            this.width = width;
            this.height = height;
            this.scale = scale;
            this.realWidth = width * scale;
            this.realHeight = height * scale;
            this.clock = new ig.Timer();
            this.canvas = ig.$(canvasId);
            this.canvas.width = this.realWidth;
            this.canvas.height = this.realHeight;
            this.context = this.canvas.getContext('2d');
        },
        setGame: function (gameClass) {
            ig.game = new(gameClass)();
            ig.system.setDelegate(ig.game);
        },
        setDelegate: function (object) {
            if (typeof(object.run) == 'function') {
                this.delegate = object;
                this.startRunLoop();
            } else {
                throw ('System.setDelegate: No run() function in object');
            }
        },
        stopRunLoop: function () {
            clearInterval(this.intervalId);
            this.time = 0;
        },
        startRunLoop: function () {
            this.stopRunLoop();
            this.intervalId = setInterval(this.run.bind(this), 1000 / this.fps);
        },
        clear: function (color) {
            this.context.fillStyle = color;
            this.context.fillRect(0, 0, this.realWidth, this.realHeight);
        },
        run: function () {
            ig.Timer.step(0, 0.05);
            this.tick = this.clock.tick();
            this.delegate.run();
            ig.input.clearPressed();
        },
        getDrawPos: function (p) {
            return this.smoothPositioning ? Math.round(p * this.scale) : Math.round(p) * this.scale;
        }
    });
});

// impact/input.js
ig.module('impact.input').defines(function () {
    ig.Input = ig.Class.extend({
        'MOUSE1': -1,
        'MOUSE2': -3,
        'MWHEEL_UP': -4,
        'MWHEEL_DOWN': -5,
        'BACKSPACE': 8,
        'TAB': 9,
        'ENTER': 13,
        'PAUSE': 19,
        'CAPS': 20,
        'ESC': 27,
        'SPACE': 32,
        'PAGE_UP': 33,
        'PAGE_DOWN': 34,
        'END': 35,
        'HOME': 36,
        'LEFT_ARROW': 37,
        'UP_ARROW': 38,
        'RIGHT_ARROW': 39,
        'DOWN_ARROW': 40,
        'INSERT': 45,
        'DELETE': 46,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        'NUMPAD_0': 96,
        'NUMPAD_1': 97,
        'NUMPAD_2': 98,
        'NUMPAD_3': 99,
        'NUMPAD_4': 100,
        'NUMPAD_5': 101,
        'NUMPAD_6': 102,
        'NUMPAD_7': 103,
        'NUMPAD_8': 104,
        'NUMPAD_9': 105,
        'MULTIPLY': 106,
        'ADD': 107,
        'SUBSTRACT': 109,
        'DECIMAL': 110,
        'DIVIDE': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'PLUS': 187,
        'COMMA': 188,
        'MINUS': 189,
        'PERIOD': 190,
        bindings: {},
        actions: {},
        locks: {},
        delayedKeyup: [],
        isUsingMouse: false,
        isUsingKeyboard: false,
        mouse: {
            x: 0,
            y: 0
        },
        initMouse: function () {
            if (this.isUsingMouse) {
                return;
            }
            this.isUsingMouse = true;
            window.addEventListener('mousewheel', this.mousewheel.bind(this), false);
            ig.system.canvas.addEventListener('contextmenu', this.contextmenu.bind(this), false);
            ig.system.canvas.addEventListener('mousedown', this.keydown.bind(this), false);
            ig.system.canvas.addEventListener('mouseup', this.keyup.bind(this), false);
            ig.system.canvas.addEventListener('mousemove', this.mousemove.bind(this), false);
        },
        initKeyboard: function () {
            if (this.isUsingKeyboard) {
                return;
            }
            this.isUsingKeyboard = true;
            window.addEventListener('keydown', this.keydown.bind(this), false);
            window.addEventListener('keyup', this.keyup.bind(this), false);
        },
        mousewheel: function (event) {
            var code = event.wheel > 0 ? this.MWHEEL_UP : this.MWHEEL_DOWN;
            var action = this.bindings[code];
            if (action) {
                this.actions[action] = true;
                event.stopPropagation();
                this.delayedKeyup.push(action);
            }
        },
        mousemove: function (event) {
            var el = ig.system.canvas;
            var pos = {
                left: 0,
                top: 0
            };
            while (el != null) {
                pos.left += el.offsetLeft;
                pos.top += el.offsetTop;
                el = el.offsetParent;
            }
            this.mouse.x = (event.pageX - pos.left) / ig.system.scale;
            this.mouse.y = (event.pageY - pos.top) / ig.system.scale;
        },
        contextmenu: function (event) {
            if (this.bindings[this.MOUSE2]) {
                event.stopPropagation();
                event.preventDefault();
            }
        },
        keydown: function (event) {
            if (event.target.type == 'text') {
                return;
            }
            var code = event.type == 'keydown' ? event.keyCode : (event.button == 2 ? this.MOUSE2 : this.MOUSE1);
            var action = this.bindings[code];
            if (action) {
                this.actions[action] = true;
                event.stopPropagation();
            }
        },
        keyup: function (event) {
            if (event.target.type == 'text') {
                return;
            }
            var code = event.type == 'keyup' ? event.keyCode : (event.button == 2 ? this.MOUSE2 : this.MOUSE1);
            var action = this.bindings[code];
            if (action) {
                this.delayedKeyup.push(action);
                event.stopPropagation();
            }
        },
        bind: function (key, action) {
            if (key < 0) {
                this.initMouse();
            }
            else if (key > 0) {
                this.initKeyboard();
            }
            this.bindings[key] = action;
        },
        unbind: function (key) {
            this.bindings[key] = null;
        },
        unbindAll: function () {
            this.bindings = [];
        },
        state: function (action) {
            return this.actions[action];
        },
        pressed: function (action) {
            if (!this.locks[action] && this.actions[action]) {
                this.locks[action] = true;
                return true;
            }
            else {
                return false;
            }
        },
        clearPressed: function () {
            for (var i = 0; i < this.delayedKeyup.length; i++) {
                var action = this.delayedKeyup[i];
                this.locks[action] = false;
                this.actions[action] = false;
            }
            this.delayedKeyup = [];
        }
    });
});

// impact/impact.js
ig.module('impact.impact').requires('dom.ready', 'impact.loader', 'impact.system', 'impact.input', 'impact.sound').defines(function () {
    ig.main = function (canvasId, gameClass, fps, width, height, scale, loaderClass) {
        ig.system = new ig.System(canvasId, fps, width, height, scale || 1);
        ig.input = new ig.Input();
        ig.soundManager = new ig.SoundManager();
        ig.music = new ig.Music();
        ig.ready = true;
        var loader = new(loaderClass || ig.Loader)(gameClass, ig.resources);
        loader.load();
    };
});

// impact/animation.js
ig.module('impact.animation').requires('impact.timer', 'impact.image').defines(function () {
    ig.AnimationSheet = ig.Class.extend({
        width: 8,
        height: 8,
        image: null,
        path: '',
        init: function (path, width, height) {
            this.path = path;
            this.width = width;
            this.height = height;
            this.image = new ig.Image(path);
        }
    });
    ig.Animation = ig.Class.extend({
        sheet: null,
        timer: null,
        sequence: [],
        flip: {
            x: false,
            y: false
        },
        tile: 0,
        frame: 0,
        loopCount: 0,
        alpha: 1,
        init: function (sheet, frameTime, sequence, stop) {
            this.sheet = sheet;
            this.timer = new ig.Timer();
            this.frameTime = frameTime;
            this.sequence = sequence;
            this.stop = !! stop;
        },
        rewind: function () {
            this.timer.reset();
            this.loopCount = 0;
            this.tile = this.sequence[0];
            return this;
        },
        gotoFrame: function (f) {
            this.timer.set(this.frameTime * -f);
            this.update();
        },
        gotoRandomFrame: function () {
            this.gotoFrame((Math.random() * this.sequence.length).floor())
        },
        update: function () {
            var frameTotal = Math.floor(this.timer.delta() / this.frameTime);
            this.loopCount = Math.floor(frameTotal / this.sequence.length);
            if (this.stop && this.loopCount > 0) {
                this.frame = this.sequence.length - 1;
            }
            else {
                this.frame = frameTotal % this.sequence.length;
            }
            this.tile = this.sequence[this.frame];
        },
        draw: function (targetX, targetY) {
            ig.system.context.globalAlpha = this.alpha;
            this.sheet.image.drawTile(targetX, targetY, this.tile, this.sheet.width, this.sheet.height, this.flip.x, this.flip.y, this.alpha);
            ig.system.context.globalAlpha = 1;
        }
    });
});

// impact/entity.js
ig.module('impact.entity').requires('impact.animation', 'impact.impact').defines(function () {
    ig.Entity = ig.Class.extend({
        settings: {},
        size: {
            x: 16,
            y: 16
        },
        offset: {
            x: 0,
            y: 0
        },
        pos: {
            x: 0,
            y: 0
        },
        last: {
            x: 0,
            y: 0
        },
        vel: {
            x: 0,
            y: 0
        },
        accel: {
            x: 0,
            y: 0
        },
        friction: {
            x: 0,
            y: 0
        },
        maxVel: {
            x: 100,
            y: 100
        },
        zIndex: 0,
        gravityFactor: 1,
        standing: false,
        bounciness: 0,
        minBounceVelocity: 40,
        anims: {},
        currentAnim: null,
        health: 10,
        type: 0,
        checkAgainst: 0,
        collides: 0,
        init: function (x, y, settings) {
            this.id = ++ig.Entity._lastId;
            this.pos.x = x;
            this.pos.y = y;
            ig.merge(this, settings);
        },
        addAnim: function (name, frameTime, sequence, stop) {
            var a = new ig.Animation(this.animSheet, frameTime, sequence, stop);
            this.anims[name] = a;
            if (!this.currentAnim) {
                this.currentAnim = a;
            }
            return a;
        },
        update: function () {
            this.last.x = this.pos.x;
            this.last.y = this.pos.y;
            this.vel.y += ig.game.gravity * ig.system.tick * this.gravityFactor;
            this.vel.x = this.getNewVelocity(this.vel.x, this.accel.x, this.friction.x, this.maxVel.x);
            this.vel.y = this.getNewVelocity(this.vel.y, this.accel.y, this.friction.y, this.maxVel.y);
            var mx = this.vel.x * ig.system.tick;
            var my = this.vel.y * ig.system.tick;
            var res = ig.game.collisionMap.getNonCollidingPosition(this.pos.x, this.pos.y, mx, my, this.size.x, this.size.y);
            this.handleCollisionResponse(res);
            if (this.currentAnim) {
                this.currentAnim.update();
            }
        },
        getNewVelocity: function (vel, accel, friction, max) {
            if (accel) {
                return (vel + accel * ig.system.tick).limit(-max, max);
            }
            else if (friction) {
                var delta = friction * ig.system.tick;
                if (vel - delta > 0) {
                    return vel - delta;
                }
                else if (vel + delta < 0) {
                    return vel + delta;
                }
                else {
                    return 0;
                }
            }
            return vel.limit(-max, max);
        },
        handleCollisionResponse: function (res) {
            this.standing = false;
            if (res.collision.y) {
                if (this.bounciness > 0 && Math.abs(this.vel.y) > this.minBounceVelocity) {
                    this.vel.y *= -this.bounciness;
                }
                else {
                    if (this.vel.y > 0) {
                        this.standing = true;
                    }
                    this.vel.y = 0;
                }
            }
            if (res.collision.x) {
                if (this.bounciness > 0 && Math.abs(this.vel.x) > this.minBounceVelocity) {
                    this.vel.x *= -this.bounciness;
                }
                else {
                    this.vel.x = 0;
                }
            }
            this.pos = res.pos;
        },
        draw: function () {
            if (this.currentAnim) {
                this.currentAnim.draw(this.pos.x.round() - this.offset.x - ig.game.screen.x, this.pos.y.round() - this.offset.y - ig.game.screen.y);
            }
        },
        kill: function () {
            ig.game.removeEntity(this);
        },
        receiveDamage: function (amount, from) {
            this.health -= amount;
            if (this.health <= 0) {
                this.kill();
            }
        },
        touches: function (other) {
            return !(this.pos.x > other.pos.x + other.size.x || this.pos.x + this.size.x < other.pos.x || this.pos.y > other.pos.y + other.size.y || this.pos.y + this.size.y < other.pos.y);
        },
        distanceTo: function (other) {
            var xd = (this.pos.x + this.size.x / 2) - (other.pos.x + other.size.x / 2);
            var yd = (this.pos.y + this.size.y / 2) - (other.pos.y + other.size.y / 2);
            return Math.sqrt(xd * xd + yd * yd);
        },
        angleTo: function (other) {
            return Math.atan2((other.pos.y + other.size.y / 2) - (this.pos.y + this.size.y / 2), (other.pos.x + other.size.x / 2) - (this.pos.x + this.size.x / 2));
        },
        check: function (other) {},
        collideWith: function (other, axis) {}
    });
    ig.Entity._lastId = 0;
    ig.Entity.COLLIDES = {
        NEVER: 0,
        LITE: 1,
        PASSIVE: 2,
        ACTIVE: 4,
        FIXED: 8
    };
    ig.Entity.TYPE = {
        NONE: 0,
        A: 1,
        B: 2,
        BOTH: 3
    };
    ig.Entity.checkPair = function (a, b) {
        if (a.checkAgainst & b.type) {
            a.check(b);
        }
        if (b.checkAgainst & a.type) {
            b.check(a);
        }
        if (a.collides && b.collides && a.collides + b.collides > ig.Entity.COLLIDES.ACTIVE) {
            ig.Entity.solveCollision(a, b);
        }
    };
    ig.Entity.solveCollision = function (a, b) {
        var weak = null;
        if (a.collides == ig.Entity.COLLIDES.LITE || b.collides == ig.Entity.COLLIDES.FIXED) {
            weak = a;
        }
        else if (b.collides == ig.Entity.COLLIDES.LITE || a.collides == ig.Entity.COLLIDES.FIXED) {
            weak = b;
        }
        if (a.last.x + a.size.x > b.last.x && a.last.x < b.last.x + b.size.x) {
            if (a.last.y < b.last.y) {
                ig.Entity.seperateOnYAxis(a, b, weak);
            }
            else {
                ig.Entity.seperateOnYAxis(b, a, weak);
            }
            a.collideWith(b, 'y');
            b.collideWith(a, 'y');
        }
        else if (a.last.y + a.size.y > b.last.y && a.last.y < b.last.y + b.size.y) {
            if (a.last.x < b.last.x) {
                ig.Entity.seperateOnXAxis(a, b, weak);
            }
            else {
                ig.Entity.seperateOnXAxis(b, a, weak);
            }
            a.collideWith(b, 'x');
            b.collideWith(a, 'x');
        }
    };
    ig.Entity.seperateOnXAxis = function (left, right, weak) {
        var nudge = (left.pos.x + left.size.x - right.pos.x);
        if (weak) {
            var strong = left === weak ? right : left;
            weak.vel.x = -weak.vel.x * weak.bounciness + strong.vel.x;
            var resWeak = ig.game.collisionMap.getNonCollidingPosition(weak.pos.x, weak.pos.y, weak == left ? -nudge : nudge, 0, weak.size.x, weak.size.y);
            weak.pos.x = resWeak.pos.x;
        }
        else {
            var v2 = (left.vel.x - right.vel.x) / 2;
            left.vel.x = -v2;
            right.vel.x = v2;
            var resLeft = ig.game.collisionMap.getNonCollidingPosition(left.pos.x, left.pos.y, -nudge / 2, 0, left.size.x, left.size.y);
            left.pos.x = resLeft.pos.x;
            var resRight = ig.game.collisionMap.getNonCollidingPosition(right.pos.x, right.pos.y, nudge / 2, 0, right.size.x, right.size.y);
            right.pos.x = resRight.pos.x;
        }
    };
    ig.Entity.seperateOnYAxis = function (top, bottom, weak) {
        var nudge = (top.pos.y + top.size.y - bottom.pos.y);
        if (weak) {
            var strong = top === weak ? bottom : top;
            weak.vel.y = -weak.vel.y * weak.bounciness + strong.vel.y;
            nudgeX = 0;
            if (weak == top && Math.abs(weak.vel.y - strong.vel.y) == 0) {
                weak.standing = true;
                nudgeX = strong.vel.x * ig.system.tick;
            }
            var resWeak = ig.game.collisionMap.getNonCollidingPosition(weak.pos.x, weak.pos.y, nudgeX, weak == top ? -nudge : nudge, weak.size.x, weak.size.y);
            weak.pos.y = resWeak.pos.y;
            weak.pos.x = resWeak.pos.x;
        }
        else if (bottom.standing || top.vel.y > 0) {
            top.pos.y -= top.pos.y + top.size.y - bottom.pos.y;
            if (top.bounciness > 0 && top.vel.y > top.minBounceVelocity) {
                top.vel.y *= -top.bounciness;
            }
            else {
                top.standing = true;
                top.vel.y = 0;
            }
        }
        else {
            var v2 = (top.vel.y - bottom.vel.y) / 2;
            top.vel.y = -v2;
            bottom.vel.y = v2;
            var resTop = ig.game.collisionMap.getNonCollidingPosition(top.pos.x, top.pos.y, 0, -nudge / 2, top.size.x, top.size.y);
            top.pos.y = resTop.pos.y;
            var resBottom = ig.game.collisionMap.getNonCollidingPosition(bottom.pos.x, bottom.pos.y, 0, nudge / 2, bottom.size.x, bottom.size.y);
            bottom.pos.y = resBottom.pos.y;
        }
    };
});

// impact/game.js
ig.module('impact.game').requires('impact.impact', 'impact.entity').defines(function () {
    ig.Game = ig.Class.extend({
        clearColor: '#000000',
        gravity: 300,
        screen: {
            x: 0,
            y: 0
        },
        entities: [],
        namedEntities: {},
        collisionMap: null,
        backgroundMaps: [],
        backgroundAnims: {},
        cellSize: 64,
        loadLevel: function (data) {
            this.screen = {
                x: 0,
                y: 0
            };
            this.entities = [];
            this.namedEntities = {};
            for (var i = 0; i < data.entities.length; i++) {
                var ent = data.entities[i];
                this.spawnEntity(ent.type, ent.x, ent.y, ent.settings);
            }
            this.sortEntities();
            this.collisionMap = null;
            this.backgroundMaps = [];
            for (var i = 0; i < data.layer.length; i++) {
                var ld = data.layer[i];
                if (ld.name == 'collision') {
                    this.collisionMap = new ig.CollisionMap(ld.tilesize, ld.data);
                }
                else {
                    var newMap = new ig.BackgroundMap(ld.tilesize, ld.data, ld.tilesetName);
                    newMap.anims = this.backgroundAnims[ld.tilesetName] || {};
                    newMap.continuous = ld.continuous;
                    newMap.distance = ld.distance;
                    this.backgroundMaps.push(newMap);
                }
            }
        },
        getEntityByName: function (name) {
            return this.namedEntities[name];
        },
        getEntitiesByType: function (type) {
            var entityClass = typeof(type) === 'string' ? ig.global[type] : type;
            var a = [];
            for (var i = 0; i < this.entities.length; i++) {
                if (this.entities[i] instanceof entityClass) {
                    a.push(this.entities[i]);
                }
            }
            return a;
        },
        spawnEntity: function (type, x, y, settings) {
            var entityClass = typeof(type) === 'string' ? ig.global[type] : type;
            if (!entityClass) {
                throw ("Can't spawn entity of type " + type);
            }
            var ent = new(entityClass)(x, y, settings || {});
            this.entities.push(ent);
            if (settings && settings.name) {
                this.namedEntities[settings.name] = ent;
            }
            return ent;
        },
        sortEntities: function () {
            this.entities.sort(function (a, b) {
                return a.zIndex - b.zIndex;
            });
        },
        removeEntity: function (ent) {
            if (ent.name) {
                delete this.namedEntities[ent.name];
            }
            this.entities.erase(ent);
        },
        run: function () {
            this.update();
            this.draw();
        },
        update: function () {
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].update();
            }
            this.checkEntities();
            for (var tileset in this.backgroundAnims) {
                var anims = this.backgroundAnims[tileset];
                for (var a in anims) {
                    anims[a].update();
                }
            }
            for (var i = 0; i < this.backgroundMaps.length; i++) {
                this.backgroundMaps[i].setScreenPos(this.screen.x, this.screen.y);
            }
        },
        draw: function () {
            ig.system.clear(this.clearColor);
            for (var i = 0; i < this.backgroundMaps.length; i++) {
                this.backgroundMaps[i].draw();
            }
            for (var i = 0; i < this.entities.length; i++) {
                this.entities[i].draw();
            }
        },
        checkEntities: function () {
            var hash = {};
            for (var e = 0; e < this.entities.length; e++) {
                var checked = {},
                    entity = this.entities[e],
                    xmin = Math.floor(entity.pos.x / this.cellSize),
                    ymin = Math.floor(entity.pos.y / this.cellSize),
                    xmax = Math.floor((entity.pos.x + entity.size.x) / this.cellSize) + 1,
                    ymax = Math.floor((entity.pos.y + entity.size.y) / this.cellSize) + 1;
                for (var x = xmin; x < xmax; x++) {
                    for (var y = ymin; y < ymax; y++) {
                        if (!hash[x]) {
                            hash[x] = {};
                            hash[x][y] = [entity];
                        }
                        else if (!hash[x][y]) {
                            hash[x][y] = [entity];
                        }
                        else {
                            var cell = hash[x][y];
                            for (var c = 0; c < cell.length; c++) {
                                if (entity.touches(cell[c]) && !checked[cell[c].id]) {
                                    checked[cell[c].id] = true;
                                    ig.Entity.checkPair(entity, cell[c]);
                                }
                            }
                            cell.push(entity);
                        }
                    }
                }
            }
        }
    });
});

// impact/map.js
ig.module('impact.map').defines(function () {
    ig.Map = ig.Class.extend({
        tilesize: 8,
        width: 1,
        height: 1,
        data: [
            []
        ],
        init: function (tilesize, data) {
            this.tilesize = tilesize;
            this.data = data;
            this.height = data.length;
            this.width = data[0].length;
        },
        getTile: function (x, y) {
            var tx = Math.floor(x / this.tilesize);
            var ty = Math.floor(y / this.tilesize);
            if ((tx >= 0 && tx < this.width) && (ty >= 0 && ty < this.height)) {
                return this.data[ty][tx];
            }
            else {
                return 0;
            }
        },
        setTile: function (x, y, tile) {
            var tx = Math.floor(x / this.tilesize);
            var ty = Math.floor(y / this.tilesize);
            if ((tx >= 0 && tx < this.width) && (ty >= 0 && ty < this.height)) {
                this.data[ty][tx] = tile;
            }
        },
    });
});

// impact/collision-map.js
ig.module('impact.collision-map').requires('impact.map').defines(function () {
    ig.CollisionMap = ig.Map.extend({
        firstSolidTile: 1,
        lastSolidTile: 255,
        init: function (tilesize, data) {
            this.parent(tilesize, data);
        },
        getNonCollidingPosition: function (x, y, vx, vy, objectWidth, objectHeight) {
            var res = {
                collision: {
                    x: false,
                    y: false
                },
                pos: {
                    x: x,
                    y: y
                },
                tile: {
                    x: 0,
                    y: 0
                }
            };
            var steps = Math.ceil(Math.max(Math.abs(vx), Math.abs(vy)) / this.tilesize);
            if (steps > 1) {
                var sx = vx / steps;
                var sy = vy / steps;
                for (var i = 0; i < steps && (sx || sy); i++) {
                    this._collisionStep(res, x, y, sx, sy, objectWidth, objectHeight);
                    x = res.pos.x;
                    y = res.pos.y;
                    if (res.collision.x) {
                        sx = 0;
                    }
                    if (res.collision.y) {
                        sy = 0;
                    }
                }
            }
            else {
                this._collisionStep(res, x, y, vx, vy, objectWidth, objectHeight);
            }
            return res;
        },
        _collisionStep: function (res, x, y, vx, vy, width, height) {
            res.pos.x += vx;
            res.pos.y += vy;
            if (vx) {
                var pxOffsetX = (vx > 0 ? width : 0);
                var tileOffsetX = (vx < 0 ? this.tilesize : 0);
                var firstTileY = Math.floor(y / this.tilesize);
                var lastTileY = Math.ceil((y + height) / this.tilesize);
                var tileX = Math.floor((x + vx + pxOffsetX) / this.tilesize);
                if (lastTileY < 0 || firstTileY >= this.height || tileX < 0 || tileX >= this.width) {
                    return;
                }
                for (var tileY = firstTileY; tileY < lastTileY; tileY++) {
                    var t = this.data[tileY] && this.data[tileY][tileX];
                    if (t >= this.firstSolidTile && t <= this.lastSolidTile) {
                        res.collision.x = true;
                        res.tile.x = t;
                        res.pos.x = tileX * this.tilesize - pxOffsetX + tileOffsetX;
                        break;
                    }
                }
            }
            if (vy) {
                var pxOffsetY = (vy > 0 ? height : 0);
                var tileOffsetY = (vy < 0 ? this.tilesize : 0);
                var firstTileX = Math.floor(res.pos.x / this.tilesize)
                var lastTileX = Math.ceil((res.pos.x + width) / this.tilesize)
                var tileY = Math.floor((y + vy + pxOffsetY) / this.tilesize);
                if (lastTileX < 0 || firstTileX >= this.width || tileY < 0 || tileY >= this.height) {
                    return;
                }
                for (var tileX = firstTileX; tileX < lastTileX; tileX++) {
                    var t = this.data[tileY] && this.data[tileY][tileX];
                    if (t >= this.firstSolidTile && t <= this.lastSolidTile) {
                        res.collision.y = true;
                        res.tile.y = t;
                        res.pos.y = tileY * this.tilesize - pxOffsetY + tileOffsetY;
                        break;
                    }
                }
            }
        }
    });
});

// impact/background-map.js
ig.module('impact.background-map').requires('impact.map', 'impact.image').defines(function () {
    ig.BackgroundMap = ig.Map.extend({
        tiles: null,
        scroll: {
            x: 0,
            y: 0
        },
        distance: 1,
        continuous: false,
        tilesetName: '',
        anims: {},
        init: function (tilesize, data, tilesetName) {
            this.parent(tilesize, data);
            this.setTileset(tilesetName);
        },
        setTileset: function (tilesetName) {
            this.tilesetName = tilesetName;
            this.tiles = new ig.Image(this.tilesetName);
        },
        setScreenPos: function (x, y) {
            this.scroll.x = x / this.distance;
            this.scroll.y = y / this.distance;
        },
        draw: function () {
            var tile = 0,
                anim = null,
                tileOffsetX = (this.scroll.x / this.tilesize) | 0,
                tileOffsetY = (this.scroll.y / this.tilesize) | 0,
                pxOffsetX = this.scroll.x % this.tilesize,
                pxOffsetY = this.scroll.y % this.tilesize,
                pxMinX = -pxOffsetX - this.tilesize,
                pxMinY = -pxOffsetY - this.tilesize,
                pxMaxX = ig.system.width + this.tilesize - pxOffsetX,
                pxMaxY = ig.system.height + this.tilesize - pxOffsetY;
            for (var mapY = -1, pxY = pxMinY; pxY < pxMaxY; mapY++, pxY += this.tilesize) {
                var tileY = mapY + tileOffsetY;
                if (tileY >= this.height) {
                    if (!this.continuous) {
                        continue;
                    }
                    tileY %= this.height;
                }
                else if (tileY < 0) {
                    if (!this.continuous) {
                        continue;
                    }
                    tileY = (tileY + 1) % this.height + this.height - 1;
                }
                for (var mapX = -1, pxX = pxMinX; pxX < pxMaxX; mapX++, pxX += this.tilesize) {
                    var tileX = mapX + tileOffsetX;
                    if (tileX >= this.width) {
                        if (!this.continuous) {
                            continue;
                        }
                        tileX %= this.width;
                    }
                    else if (tileX < 0) {
                        if (!this.continuous) {
                            continue;
                        }
                        tileX = (tileX + 1) % this.width + this.width - 1;
                    }
                    if ((tile = this.data[tileY][tileX])) {
                        if ((anim = this.anims[tile - 1])) {
                            anim.draw(pxX, pxY);
                        }
                        else {
                            this.tiles.drawTile(pxX, pxY, tile - 1, this.tilesize);
                        }
                    }
                }
            }
        }
    });
});

// drop.js
ig.module('drop').requires('impact.game', 'impact.entity', 'impact.collision-map', 'impact.background-map', 'impact.font').defines(function () {
    FullsizeBackdrop = ig.Image.extend({
        resize: function () {},
        first: true,
        draw: function () {
            if (!this.loaded) {
                return;
            }
            if (!this.first) {
                ig.system.context.globalAlpha = 0.8;
            }
            else {
                ig.system.context.globalAlpha = 1;
                this.first = false;
            }
            ig.system.context.drawImage(this.data, 0, 0);
            ig.system.context.globalAlpha = 1;
        }
    });
    EntityCoin = ig.Entity.extend({
        size: {
            x: 6,
            y: 6
        },
        offset: {
            x: -1,
            y: -1
        },
        animSheet: new ig.AnimationSheet('media/coin.png', 4, 4),
        type: ig.Entity.TYPE.B,
        sound: new ig.Sound('media/coin.ogg'),
        init: function (x, y, settings) {
            this.addAnim('idle', 0.1, [0, 1]);
            this.parent(x, y, settings);
        },
        update: function () {
            this.parent();
            if (this.pos.y - ig.game.screen.y < -32) {
                this.kill();
            }
        },
        pickup: function () {
            ig.game.score += 500;
            this.sound.play();
            this.kill();
        }
    });
    EntityPlayer = ig.Entity.extend({
        size: {
            x: 4,
            y: 4
        },
        checkAgainst: ig.Entity.TYPE.B,
        animSheet: new ig.AnimationSheet('media/player.png', 4, 4),
        maxVel: {
            x: 50,
            y: 300
        },
        friction: {
            x: 600,
            y: 0
        },
        speed: 300,
        bounciness: 0.5,
        sound: new ig.Sound('media/bounce.ogg'),
        init: function (x, y, settings) {
            this.addAnim('idle', 0.1, [0]);
            this.parent(x, y, settings);
        },
        update: function () {
            if (ig.input.state('left')) {
                this.accel.x = -this.speed;
            }
            else if (ig.input.state('right')) {
                this.accel.x = this.speed;
            }
            else {
                this.accel.x = 0;
            }
            this.parent();
        },
        handleCollisionResponse: function (res) {
            if (res.collision.y && this.vel.y > 32) {
                this.sound.play();
            }
            this.parent(res);
        },
        check: function (other) {
            other.pickup();
        }
    });
    DropLoader = ig.Loader.extend({
        end: function () {
            for (i in ig.Image.cache) {
                var img = ig.Image.cache[i];
                if (!(img instanceof FullsizeBackdrop)) {
                    this.pixify(img, ig.system.scale);
                }
            }
            this.parent();
        },
        pixify: function (img, s) {
            var ctx = img.data.getContext('2d');
            var px = ctx.getImageData(0, 0, img.data.width, img.data.height);
            for (var y = 0; y < img.data.height; y++) {
                for (var x = 0; x < img.data.width; x++) {
                    var index = (y * img.data.width + x) * 4;
                    var alpha = (x % s == 0 || y % s == 0) ? 0 : 0.9;
                    px.data[index + 3] = px.data[index + 3] * alpha;
                }
            }
            ctx.putImageData(px, 0, 0);
        }
    });
    DropGame = ig.Game.extend({
        clearColor: '#c7e300',
        gravity: 240,
        player: null,
        map: [],
        score: 0,
        speed: 1,
        tiles: new ig.Image('media/tiles.png'),
        backdrop: new FullsizeBackdrop('media/backdrop.png'),
        font: new ig.Font('media/04b03.font.png'),
        gameOverSound: new ig.Sound('media/gameover.ogg'),
        init: function () {
            ig.system.smoothPositioning = false;
            ig.input.bind(ig.input.LEFT_ARROW, 'left');
            ig.input.bind(ig.input.RIGHT_ARROW, 'right');
            ig.input.bind(ig.input.ENTER, 'ok');
            this.map = [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0], ]
            for (var y = 8; y < 18; y++) {
                this.map[y] = this.getRow();
            }
            this.collisionMap = new ig.CollisionMap(8, this.map);
            this.backgroundMaps.push(new ig.BackgroundMap(8, this.map, 'media/tiles.png'));
            this.player = this.spawnEntity(EntityPlayer, ig.system.width / 2 - 2, 16);
        },
        getRow: function () {
            var row = [];
            for (var x = 0; x < 8; x++) {
                row[x] = Math.random() > 0.93 ? 1 : 0;
            }
            return row;
        },
        placeCoin: function () {
            for (var i = 0; i < 12; i++) {
                var tile = (Math.random() * 8).ceil();
                if (this.map[this.map.length - 1][tile] && !this.map[this.map.length - 2][tile]) {
                    var y = (this.map.length - 1) * 8;
                    var x = tile * 8 + 1;
                    this.spawnEntity(EntityCoin, x, y);
                    return;
                }
            }
        },
        update: function () {
            if (ig.input.pressed('ok')) {
                ig.system.setGame(DropGame);
            }
            if (this.gameOver) {
                return;
            }
            this.speed += ig.system.tick * (10 / this.speed);
            this.screen.y += ig.system.tick * this.speed;
            this.score += ig.system.tick * this.speed;
            if (this.screen.y > 40) {
                this.screen.y -= 8;
                for (var i = 0; i < this.entities.length; i++) {
                    this.entities[i].pos.y -= 8;
                }
                this.map.shift();
                this.map.push(this.getRow());
                if (Math.random() > 0.5) {
                    this.placeCoin();
                }
            }
            this.parent();
            var pp = this.player.pos.y - this.screen.y;
            if (pp > ig.system.height + 8 || pp < -32) {
                this.gameOver = true;
                this.gameOverSound.play();
            }
        },
        draw: function () {
            this.backdrop.draw();
            if (this.gameOver) {
                this.font.draw('Game Over!', ig.system.width / 2, 32, ig.Font.ALIGN.CENTER);
                this.font.draw('Press Enter', ig.system.width / 2, 48, ig.Font.ALIGN.CENTER);
                this.font.draw('to Restart', ig.system.width / 2, 56, ig.Font.ALIGN.CENTER);
            }
            else {
                for (var i = 0; i < this.backgroundMaps.length; i++) {
                    this.backgroundMaps[i].draw();
                }
                for (var i = 0; i < this.entities.length; i++) {
                    this.entities[i].draw();
                }
            }
            this.font.draw(this.score.floor().toString(), ig.system.width - 2, 2, ig.Font.ALIGN.RIGHT);
        }
    });
    ig.main('#canvas', DropGame, 30, 64, 96, 5, DropLoader);
});