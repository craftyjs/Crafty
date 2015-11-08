var Crafty = require('../core/core.js');

module.exports = {
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
     * @see Crafty.load
     */
    assets: {},
    __paths: { audio: "", images: "" },
    /**@
     * #Crafty.paths
     * @category Assets
     * @sign public void Crafty.paths([Object paths])
     * @param paths - Object containing paths for audio and images folders
     *
     * Function to define custom folder for audio and images. You should use
     * this function to avoid typing the same paths again and again when
     * loading assets with the Crafty.load() function.
     *
     * If you do not give a object you get the current paths for both audio
     * and images back.
     *
     * You do not have to define paths.
     *
     * @example
     *
     *
     * Setting folders:
     * ~~~
     * Crafty.paths({ audio: "custom/audio/path/", images: "custom/images/path/" });
     *
     * Crafty.load({
     *   "audio": {
     *     "ray": ['ray.mp3'] // This loads ray.mp3 from custom/audio/path/ray.mp3
     *   }
     * }, function() {
     *   Crafty.log('loaded');
     * });
     * ~~~
     *
     * @see Crafty.load
     */
    paths: function(p) {
        if (typeof p === "undefined") {
            return this.__paths;
        } else {
            if(p.audio)
                this.__paths.audio = p.audio;
            if(p.images)
                this.__paths.images = p.images;
        }
    },

    /**@
     * #Crafty.asset
     * @category Assets
     * @trigger NewAsset - After setting new asset - Object - key and value of new added asset.
     * @sign public void Crafty.asset(String key, Object asset)
     * @param key - asset url.
     * @param asset - `Audio` or `Image` object.
     *
     * Add new asset to assets object.
     *
     * @sign public void Crafty.asset(String key)
     * @param key - asset url.
     *
     *
     * Get asset from assets object.
     *
     * @example
     * ~~~
     * Crafty.asset(key, value);
     * var asset = Crafty.asset(key); //object with key and value fields
     * ~~~
     *
     * @see Crafty.assets
     */
    asset: function (key, value) {
        if (arguments.length === 1) {
            return Crafty.assets[key];
        }

        if (!Crafty.assets[key]) {
            Crafty.assets[key] = value;
            this.trigger("NewAsset", {
                key: key,
                value: value
            });
            return value;
        }
    },
    /**@
     * #Crafty.image_whitelist
     * @category Assets
     *
     * A list of file extensions that can be loaded as images by Crafty.load
     *
     * @example
     * ~~~
     * // add tif extension to list of supported image files
     * Crafty.image_whitelist.push("tif");
     *
     * var assets = {
     *     "sprites": {
     *         "sprite.tif": {   //set a tif sprite
     *            "tile": 64,
     *            "tileh": 32,
     *            "map": { "sprite_car": [0, 0] }
     *         }
     *     },
     *     "audio": {
     *         "jump": "jump.mp3";
     *     }
     * };
     *
     * Crafty.load( assets, // preload the assets
     *     function() {     //when loaded
     *         Crafty.audio.play("jump"); //Play the audio file
     *         Crafty.e('2D, DOM, sprite_car'); // create entity with sprite
     *     },
     *
     *     function(e) { //progress
     *     },
     *
     *     function(e) { //uh oh, error loading
     *     }
     * );
     * ~~~
     *
     * @see Crafty.asset
     * @see Crafty.load
     */
    image_whitelist: ["jpg", "jpeg", "gif", "png", "svg"],
    /**@
     * #Crafty.load
     * @category Assets
     * @sign public void Crafty.load(Object assets, Function onLoad[, Function onProgress[, Function onError]])
     * @param assets - Object JSON formatted (or JSON string), with assets to load (accepts sounds, images and sprites)
     * @param onLoad - Callback when the assets are loaded
     * @param onProgress - Callback when an asset is loaded. Contains information about assets loaded
     * @param onError - Callback when an asset fails to load
     *
     * Preloader for all assets. Takes a JSON formatted object (or JSON string) of files and adds them to the
     * `Crafty.assets` object, as well as setting sprites accordingly.
     *
     * Format must follow the pattern shown in the example below, but it's not required to pass all "audio",
     * "images" and "sprites" properties, only those you'll need. For example, if you don't need to preload
     * sprites, you can omit that property.
     *
     * By default, Crafty will assume all files are in the current path.  For changing these,
     * use the function `Crafty.paths`.
     *
     * Files with suffixes in `image_whitelist` (case insensitive) will be loaded.
     *
     * It's possible to pass the full file path(including protocol), instead of just the filename.ext, in case
     * you want some asset to be loaded from another domain.
     *
     * If `Crafty.support.audio` is `true`, files with the following suffixes `mp3`, `wav`, `ogg` and
     * `mp4` (case insensitive) can be loaded.
     *
     * The `onProgress` function will be passed on object with information about
     * the progress including how many assets loaded, total of all the assets to
     * load and a percentage of the progress.
     * ~~~
     * { loaded: j, total: total, percent: (j / total * 100), src:src }
     * ~~~
     *
     * `onError` will be passed with the asset that couldn't load.
     *
     * When `onError` is not provided, the onLoad is loaded even when some assets are not successfully loaded.
     * Otherwise, onLoad will be called no matter whether there are errors or not.
     *
     * @example
     * ~~~
     * var assetsObj = {
     *     "audio": {
     *         "beep": ["beep.wav", "beep.mp3", "beep.ogg"],
     *         "boop": "boop.wav",
     *         "slash": "slash.wav"
     *     },
     *     "images": ["badguy.bmp", "goodguy.png"],
     *     "sprites": {
     *         "animals.png": {
     *             "tile": 50,
     *             "tileh": 40,
     *             "map": { "ladybug": [0,0], "lazycat": [0,1], "ferociousdog": [0,2] }
     *             "paddingX": 5,
     *             "paddingY": 5,
     *             "paddingAroundBorder": 10
     *         },
     *         "vehicles.png": {
     *             "tile": 150,
     *             "tileh": 75,
     *             "map": { "car": [0,0], "truck": [0,1] }
     *         }
     *     },
     * };
     *
     * Crafty.load(assetsObj, // preload assets
     *     function() { //when loaded
     *         Crafty.scene("main"); //go to main scene
     *         Crafty.audio.play("boop"); //Play the audio file
     *         Crafty.e('2D, DOM, lazycat'); // create entity with sprite
     *     },
     *
     *     function(e) { //progress
     *     },
     *
     *     function(e) { //uh oh, error loading
     *     }
     * );
     * ~~~
     *
     * @see Crafty.paths
     * @see Crafty.assets
     * @see Crafty.image_whitelist
     * @see Crafty.removeAssets
     */
    load: function (data, oncomplete, onprogress, onerror) {

        if (Array.isArray(data)) {
            Crafty.log("Calling Crafty.load with an array of assets no longer works; see the docs for more details.");
        }

        data = (typeof data === "string" ? JSON.parse(data) : data);

        var j = 0,
            total = (data.audio ? Object.keys(data.audio).length : 0) +
              (data.images ? Object.keys(data.images).length : 0) +
              (data.sprites ? Object.keys(data.sprites).length : 0),
            current, fileUrl, obj, type, asset,
            audSupport = Crafty.support.audio,
            paths = Crafty.paths(),
            getExt = function(f) {
                return f.substr(f.lastIndexOf('.') + 1).toLowerCase();
            },
            getFilePath = function(type,f) {
                return (f.search("://") === -1 ? (type == "audio" ? paths.audio + f : paths.images + f) : f);
            },
            // returns null if 'a' is not already a loaded asset, obj otherwise
            isAsset = function(a) {
                return Crafty.asset(a) || null;
            },
            isSupportedAudio = function(f) {
                return Crafty.audio.supports(getExt(f));
            },
            isValidImage = function(f) {
                return Crafty.image_whitelist.indexOf(getExt(f)) != -1;
            },
            onImgLoad = function(obj,url) {
                obj.onload = pro;
                if (Crafty.support.prefix === 'webkit')
                    obj.src = ""; // workaround for webkit bug
                obj.src = url;
            };

        //Progress function

        function pro() {
            var src = this.src;

            //Remove events cause audio trigger this event more than once(depends on browser)
            if (this.removeEventListener)
                this.removeEventListener('canplaythrough', pro, false);

            j++;
            //if progress callback, give information of assets loaded, total and percent
            if (onprogress)
                onprogress({
                    loaded: j,
                    total: total,
                    percent: (j / total * 100),
                    src: src
                });

            if (j === total && oncomplete) oncomplete();
        }
        //Error function

        function err() {
            var src = this.src;
            if (onerror)
                onerror({
                    loaded: j,
                    total: total,
                    percent: (j / total * 100),
                    src: src
                });

            j++;
            if (j === total && oncomplete) oncomplete();
        }

        for (type in data) {
            for(asset in data[type]) {
                if (!data[type].hasOwnProperty(asset))
                    continue; // maintain compatibility to other frameworks while iterating array

                current = data[type][asset];

                if (type === "audio" && audSupport) {
                    if (typeof current === "object") {
                        var files = [];
                        for (var i in current) {
                            fileUrl = getFilePath(type, current[i]);
                            if (!isAsset(fileUrl) && isSupportedAudio(current[i]))
                                files.push(fileUrl);
                        }
                        obj = Crafty.audio.add(asset, files).obj;
                    }
                    else if (typeof current === "string" && isSupportedAudio(current)) {
                        fileUrl = getFilePath(type, current);
                        if (!isAsset(fileUrl))
                            obj = Crafty.audio.add(asset, fileUrl).obj;
                    }

                    //addEventListener is supported on IE9 , Audio as well
                    if (obj && obj.addEventListener)
                        obj.addEventListener('canplaythrough', pro, false);
                } else {
                    asset = (type === "sprites" ? asset : current);
                    fileUrl = getFilePath(type, asset);
                    if (isValidImage(asset)) {
                        obj = isAsset(fileUrl);
                        if (!obj) {
                            obj = new Image();
                            if (type === "sprites")
                                Crafty.sprite(current.tile, current.tileh, fileUrl, current.map,
                                  current.paddingX, current.paddingY, current.paddingAroundBorder);
                            Crafty.asset(fileUrl, obj);
                        }
                        onImgLoad(obj, fileUrl);
                    }
                }
                if (obj)
                    obj.onerror = err;
                else
                    --total;
            }
        }

        // If we aren't trying to handle *any* of the files, that's as complete as it gets!
        if (total === 0)
            oncomplete();

    },
    /**@
     * #Crafty.removeAssets
     * @category Assets
     *
     * @sign public void Crafty.removeAssets(Object assets)
     * @param data - Object JSON formatted (or JSON string), with assets to remove (accepts sounds, images and sprites)
     *
     * Removes assets (audio, images, sprites - and related sprite components) in order to allow the browser
     * to free memory.
     *
     * Recieves a JSON fomatted object (or JSON string) containing 'audio', 'images' and/or 'sprites'
     * properties with assets to be deleted. Follows a similar format as Crafty.load 'data' argument. If
     * you pass the exact same object passed to Crafty.load, that will delete everything loaded that way.
     * For sprites, if you want to keep some specific component, just don't pass that component's name in
     * the sprite 'map'.
     *
     * Note that in order to remove the sprite components related to a given sprite, it's required to
     * pass the 'map' property of that sprite, and although its own properties's values (the properties refer
     * to sprite components) are not used in the removing process, omitting them will cause an error (since
     * 'map' is an object, thus it's properties can NOT omitted - however, they can be null, or undefined).
     * It will work as long as the 'map' objects' properties have any value. Or if you define 'map' itself
     * as an array, like:
     * "map": [ "car", "truck" ] instead of "map": { "car": [0,0], "truck": [0,1] }.
     * This is examplified below ("animals.png" VS. "vehicles.png" sprites).
     *
     * @example
     * ~~~
     * var assetsToRemoveObj = {
     *     "audio": {
     *         "beep": ["beep.wav", "beep.mp3", "beep.ogg"],
     *         "boop": "boop.wav"
     *     },
     *     "images": ["badguy.bmp", "goodguy.png"],
     *     "sprites": {
     *         "animals.png": {
     *             "map": { "ladybug": [0,0], "lazycat": [0,1] },
     *         },
     *         "vehicles.png": {
     *             "map": [ "car", "truck" ]
     *         }
     *     }
     * }
     *
     * Crafty.removeAssets(assetsToRemoveObj);
     * ~~~
     *
     * @see Crafty.load
     */
    removeAssets: function(data) {

        data = (typeof data === "string" ? JSON.parse(data) : data);

        var current, fileUrl, type, asset,
            paths = Crafty.paths(),
            getFilePath = function(type,f) {
                return (f.search("://") === -1 ? (type == "audio" ? paths.audio + f : paths.images + f) : f);
            };

        for (type in data) {
            for (asset in data[type]) {
                if (!data[type].hasOwnProperty(asset))
                    continue; // maintain compatibility to other frameworks while iterating array

                current = data[type][asset];

                if (type === "audio") {
                    if (typeof current === "object") {
                        for (var i in current) {
                            fileUrl = getFilePath(type, current[i]);
                            if (Crafty.asset(fileUrl))
                                Crafty.audio.remove(asset);
                        }
                    }
                    else if (typeof current === "string") {
                        fileUrl = getFilePath(type, current);
                        if (Crafty.asset(fileUrl))
                            Crafty.audio.remove(asset);
                    }
                } else {
                    asset = (type === "sprites" ? asset : current);
                    fileUrl = getFilePath(type, asset);
                    if (Crafty.asset(fileUrl)) {
                        if (type === "sprites")
                            for (var comp in current.map)
                                delete Crafty.components()[comp];
                        delete Crafty.assets[fileUrl];
                    }
                }
            }
        }
    }
};
