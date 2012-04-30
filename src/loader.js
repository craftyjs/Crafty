Crafty.extend({
/**@
	* #Crafty.assets
	* @category Assets
	* An object containing every asset used in the current Crafty game.
	* The key is the URL and the value is the `Audio` or `Image` object.
	*
	* If loading an asset, check that it is in this object first to avoid loading twice.
	* 
	* @example
	* ~~~
	* var isLoaded = !!Crafty.assets["images/sprite.png"];
	* ~~~
	* @see Crafty.loader
	*/
	assets: {},

	/**@
	* #Crafty.loader
	* @category Assets
	* @sign public void Crafty.load(Array assets, Function onLoad[, Function onProgress, Function onError])
	* @param assets - Array of assets to load (accepts sounds and images)
	* @param onLoad - Callback when the assets are loaded
	* @param onProgress - Callback when an asset is loaded. Contains information about assets loaded
	* @param onError - Callback when an asset fails to load
	* 
	* Preloader for all assets. Takes an array of URLs and
	* adds them to the `Crafty.assets` object.
	*
	* Files with suffixes `jpg`, `jpeg`, `gif` and `png` (case insensitive) will be loaded.
	*
	* If `Crafty.support.audio` is `true`, files with the following suffixes `mp3`, `wav`, `ogg` and `mp4` (case insensitive) can be loaded.
	*
	* The `onProgress` function will be passed on object with information about
	* the progress including how many assets loaded, total of all the assets to
	* load and a percentage of the progress.
    * ~~~
    * { loaded: j, total: total, percent: (j / total * 100) ,src:src})
	* ~~~
	*
	* `onError` will be passed with the asset that couldn't load.
    *
	* When `onError` is not provided, the onLoad is loaded even some assests are not successfully loaded. Otherwise, onLoad will be called no matter whether there are errors or not. 
	* 
	* @example
	* ~~~
	* Crafty.load(["images/sprite.png", "sounds/jump.mp3"],
	*     function() {
	*         //when loaded
	*         Crafty.scene("main"); //go to main scene
	*         Crafty.audio.play("jump.mp3"); //Play the audio file
	*     },
	*
	*     function(e) {
	*       //progress
	*     },
	*
	*     function(e) {
	*       //uh oh, error loading
	*     }
	* );
	* ~~~
	* 
	* @see Crafty.assets
	*/
    load: function (data, oncomplete, onprogress, onerror) {
            
        var i = 0, l = data.length, current, obj, total = l, j = 0, ext = "" ;
  
        //Progress function
        function pro(){
            var src = this.src;
           
            //Remove events cause audio trigger this event more than once(depends on browser)
            if (this.removeEventListener) {  
                this.removeEventListener('canplaythrough', pro, false);     
            }
           
            ++j;
            //if progress callback, give information of assets loaded, total and percent
            if (onprogress) 
                onprogress({
                    loaded: j, 
                    total: total, 
                    percent: (j / total * 100),
                    src:src
                });
				
            if(j === total && oncomplete) oncomplete();
        };
        //Error function
        function err(){
            var src = this.src;
            if (onerror) 
                onerror({
                    loaded: j, 
                    total: total, 
                    percent: (j / total * 100),
                    src:src
                });
           		
            j++;
            if(j === total && oncomplete) oncomplete();
        };
           
        for (; i < l; ++i) {       
            current = data[i];
            ext = current.substr(current.lastIndexOf('.') + 1).toLowerCase();
           
            obj = this.assets[current] || null;   
          
            if (Crafty.support.audio && Crafty.audio.supported[ext]) {   
                //Create new object if not exists
                if(!obj){
                    var name = current.substr(current.lastIndexOf('/') + 1).toLowerCase();
                    obj = Crafty.audio.audioElement();
                    obj.id = name;
                    obj.src = current;
                    obj.preload = "auto";
                    obj.volume = Crafty.audio.volume;
                    if (!Crafty.assets[current]) Crafty.assets[current] = obj; 
                    Crafty.audio.sounds[name] = {
                        obj:obj,
                        played:0
                    } 
                }
        
                //addEventListener is supported on IE9 , Audio as well
                if (obj.addEventListener) {  
                    obj.addEventListener('canplaythrough', pro, false);     
                }
                   
                 
            } else if (ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "png") { 
                if(!obj) {
                    obj = new Image();
                    if (!Crafty.assets[current]) Crafty.assets[current] = obj;   
                }
                obj.onload=pro;
                obj.src = current; //setup src after onload function Opera/IE Bug
             
            } else {
                total--;
                continue; //skip if not applicable
            }
            obj.onerror = err;
        }
       
       
    },
	/**@
	* #Crafty.modules
	* @category Assets
	* @sign public void Crafty.modules([String repoLocation,] Object moduleMap[, Function onLoad])
	* @param modules - Map of name:version pairs for modules to load
	* @param onLoad - Callback when the modules are loaded
	* 
	* Browse the selection of modules on crafty repositories.
	* Downloads and executes the javascript in the specified modules.
	* If no repository is specified it defaults to http://cdn.craftycomponents.com
	*
	* Available repositories:
	*
	* 	- http://cdn.craftycomponents.com
	* 	- http://cdn.crafty-modules.com
	*
	*
	* @example
	* ~~~
	* // Loading from default repository
	* Crafty.modules({ moveto: 'DEV' }, function () {
	*     //module is ready
	*     Crafty.e("MoveTo, 2D, DOM");
	* });
	*
	* // Loading from your own server
	* Crafty.modules({ 'http://mydomain.com/js/mystuff.js': 'DEV' }, function () {
	*     //module is ready
	*     Crafty.e("MoveTo, 2D, DOM");
	* });
	*
	* // Loading from alternative repository
	* Crafty.modules('http://cdn.crafty-modules.com', { moveto: 'DEV' }, function () {
	*     //module is ready
	*     Crafty.e("MoveTo, 2D, DOM");
	* });
	*
	* // Loading from the latest component website
	* Crafty.modules(
	*     'http://cdn.craftycomponents.com'
	*     , { MoveTo: 'release' }
	*     , function () {
	*     Crafty.e("2D, DOM, Color, MoveTo")
	*       .attr({x: 0, y: 0, w: 50, h: 50})
	*       .color("green");
	*     });
	* });
	* ~~~
	*
	*/
	modules: function (modulesRepository, moduleMap, oncomplete) {

		if (arguments.length === 2 && typeof modulesRepository === "object") {
			oncomplete = moduleMap;
			moduleMap = modulesRepository;
			modulesRepository = 'http://cdn.craftycomponents.com';
		}

		/*!
		  * $script.js Async loader & dependency manager
		  * https://github.com/ded/script.js
		  * (c) Dustin Diaz, Jacob Thornton 2011
		  * License: MIT
		  */
		var $script = (function () {
			var win = this, doc = document
			, head = doc.getElementsByTagName('head')[0]
			, validBase = /^https?:\/\//
			, old = win.$script, list = {}, ids = {}, delay = {}, scriptpath
			, scripts = {}, s = 'string', f = false
			, push = 'push', domContentLoaded = 'DOMContentLoaded', readyState = 'readyState'
			, addEventListener = 'addEventListener', onreadystatechange = 'onreadystatechange'

			function every(ar, fn, i) {
				for (i = 0, j = ar.length; i < j; ++i) if (!fn(ar[i])) return f
				return 1
			}
			function each(ar, fn) {
				every(ar, function (el) {
					return !fn(el)
				})
			}

			if (!doc[readyState] && doc[addEventListener]) {
				doc[addEventListener](domContentLoaded, function fn() {
					doc.removeEventListener(domContentLoaded, fn, f)
					doc[readyState] = 'complete'
				}, f)
				doc[readyState] = 'loading'
			}

			function $script(paths, idOrDone, optDone) {
				paths = paths[push] ? paths : [paths]
				var idOrDoneIsDone = idOrDone && idOrDone.call
				, done = idOrDoneIsDone ? idOrDone : optDone
				, id = idOrDoneIsDone ? paths.join('') : idOrDone
				, queue = paths.length
				function loopFn(item) {
					return item.call ? item() : list[item]
				}
				function callback() {
					if (!--queue) {
						list[id] = 1
						done && done()
						for (var dset in delay) {
							every(dset.split('|'), loopFn) && !each(delay[dset], loopFn) && (delay[dset] = [])
						}
					}
				}
				setTimeout(function () {
					each(paths, function (path) {
						if (scripts[path]) {
							id && (ids[id] = 1)
							return scripts[path] == 2 && callback()
						}
						scripts[path] = 1
						id && (ids[id] = 1)
						create(!validBase.test(path) && scriptpath ? scriptpath + path + '.js' : path, callback)
					})
				}, 0)
				return $script
			}

			function create(path, fn) {
				var el = doc.createElement('script')
				, loaded = f
				el.onload = el.onerror = el[onreadystatechange] = function () {
					if ((el[readyState] && !(/^c|loade/.test(el[readyState]))) || loaded) return;
					el.onload = el[onreadystatechange] = null
					loaded = 1
					scripts[path] = 2
					fn()
				}
				el.async = 1
				el.src = path
				head.insertBefore(el, head.firstChild)
			}

			$script.get = create

			$script.order = function (scripts, id, done) {
				(function callback(s) {
					s = scripts.shift()
					if (!scripts.length) $script(s, id, done)
					else $script(s, callback)
				}())
			}

			$script.path = function (p) {
				scriptpath = p
			}
			$script.ready = function (deps, ready, req) {
				deps = deps[push] ? deps : [deps]
				var missing = [];
				!each(deps, function (dep) {
					list[dep] || missing[push](dep);
				}) && every(deps, function (dep) { return list[dep] }) ?
				ready() : !function (key) {
					delay[key] = delay[key] || []
					delay[key][push](ready)
					req && req(missing)
				}(deps.join('|'))
				return $script
			}

			$script.noConflict = function () {
				win.$script = old;
				return this
			}

			return $script
		})();

		var modules = [];
		for (var i in moduleMap) {
			if (i.indexOf("http://") != -1)
				modules.push(i)
			else
				modules.push(modulesRepository + '/' + i.toLowerCase() + '-' + moduleMap[i].toLowerCase() + '.js');
		}

		$script(modules, function () {
			if (oncomplete) oncomplete();
		});
	}
});
