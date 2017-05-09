var Crafty = require('../core/core.js');

Crafty.extend({
    _drawLayerTemplates: {},
    _drawLayers: [],
    _addDrawLayerInstance: function (layer) {
        Crafty._drawLayers.push(layer);
        this._drawLayers.sort(function (a, b) { return a.options.z - b.options.z; });
    },

    _removeDrawLayerInstance: function (layer) {
        var i = this._drawLayers.indexOf(layer);
        if (i >= 0) {
            this._drawLayers.splice(i, 1);
        }
        this._drawLayers.sort(function (a, b) { return a.options.z - b.options.z; });
    },

    _registerLayerTemplate: function (type, layerTemplate) {
        this._drawLayerTemplates[type] = layerTemplate;
        var common = this._commonLayerProperties;

        // merge inits
        if (typeof layerTemplate.init === 'function') {
            var layerInit = layerTemplate.init;
            var commonInit = common.init;
            layerTemplate.init = function() {
                layerInit.call(this);
                commonInit.call(this);
            };
        }
        // merge removes
        if (typeof layerTemplate.remove === 'function') {
            var layerRemove = layerTemplate.remove;
            var commonRemove = common.remove;
            layerTemplate.remove = function() {
                layerRemove.call(this);
                commonRemove.call(this);
            };
        }
        // add common properties, don't overwrite existing ones
        for (var key in common) {
            if (layerTemplate[key]) continue;
            layerTemplate[key] = common[key];
        }

        // A marker to avoid creating temporary objects
        layerTemplate._viewportRectHolder = {};
    },

    _commonLayerProperties: {
        // Layer options
        options: {
            xResponse: 1,
            yResponse: 1,
            scaleResponse: 1,
            z: 0
        },

        // Track dirty viewport state - render code should uncheck flag once finished handling it
        _dirtyViewport: false,

        // This init code will be run after any other specific layer init code
        init: function() {
            // Handle viewport modifications
            this.uniqueBind("ViewportResize", this._resize);
            this.uniqueBind("InvalidateViewport", function () {
                this._dirtyViewport = true;
            });

            // Bind scene rendering (see drawing.js)
            this.uniqueBind("RenderScene", this._render);

            // Set pixelart to current status, and listen for changes
            this._setPixelart(Crafty._pixelartEnabled);
            this.uniqueBind("PixelartSet", this._setPixelart);

            Crafty._addDrawLayerInstance(this);
        },
        // This remove code will be run after any other specific layer remove code
        remove: function() {
            Crafty._removeDrawLayerInstance(this);
        },

        _resize: function() {
            // per default, do nothing
            // specific layer should overwrite this method
        },
        _setPixelart: function(enabled) {
            // per default, do nothing
            // specific layer should overwrite this method
        },
        _render: function() {
            // per default, render nothing
            // specific layer should overwrite this method
        },

        // Sort function for rendering in the correct order
        // Sort by globalZ
        _sort: function(a, b) {
            return a._globalZ - b._globalZ;
        },

        // Based on the camera options, find the Crafty coordinates corresponding to the layer's position in the viewport
        _viewportRect: function () {
            var options = this.options;
            var rect = this._viewportRectHolder;
            var scale = Math.pow(Crafty.viewport._scale, options.scaleResponse);
            var viewport = Crafty.viewport;
            rect._scale = scale;
            rect._w = viewport._width / scale;
            rect._h = viewport._height / scale;

            
            // This particular transformation is designed such that,
            // if a combination pan/scale keeps the center of the screen fixed for a layer with x/y response of 1,
            // then it will also be fixed for layers with other values for x/y response
            // (note that the second term vanishes when either the response or scale are 1)
            rect._x = options.xResponse * (-viewport._x) - 
                0.5 * (options.xResponse - 1) * (1 - 1 / scale) * viewport._width;  
            rect._y = options.yResponse * (-viewport._y) - 
                0.5 * (options.yResponse - 1) * (1 - 1 / scale) * viewport._height; 
            return rect;
        },
        // A tracker for whether any elements in this layer need to listen to mouse/touch events
        _pointerEntities: 0
    },

    /**@
     * #Crafty.createLayer
     * @kind Method
     * @category Graphics
     *
     * @sign public void Crafty.createLayer(string name, string type[, object options])
     * @param name - the name that will refer to the layer
     * @param type - the type of the draw layer to create ('DOM', 'Canvas', or 'WebGL')
     * @param options - this will override the default values of each layer
     *
     * Creates a new system which implements the specified type of layer.  The options (and their default values) are
     *
     * ```
     * {
     *   xResponse: 1,  // How the layer will pan in response to the viewport x position
     *   yResponse: 1,  // How the layer will pan in response to the viewport y position
     *   scaleResponse: 1, // How the layer will scale in response to the viewport scale.  (Layer scale will be scale^scaleResponse.)
     *   z: 0 // The zIndex of the layer relative to other layers
     * }
     * ```
     *
     * Crafty will automatically define three built-in layers: "DefaultDOMLayer", DefaultCanvasLayer",  and "DefaultWebGLLayer".
     * They will have `z` values of `30`, `20`, and `10` respectively, and will be initialized if a "DOM", "Canvas" or "WebGL" component
     * is used with an entity not attached to any user-specified layer.
     * 
     * @note Layers are implemented as systems, so the layer name must be distinct from other systems.
     * 
     * @note By default, layers will persist across scene changes.  You can manually clean up a layer by removing all it's entities and then destroying it.
     *
     * @example
     * ```
     * Crafty.createLayer("MyCanvasLayer", "Canvas")
     * Crafty.e("2D, MyCanvasLayer, Color");
     * ```
     * Define a custom canvas layer, then create an entity that uses the custom layer to render.
     *
     * @example
     * ```
     * Crafty.createLayer("UILayer", "DOM", {scaleResponse: 0, xResponse: 0, yResponse: 0})
     * Crafty.e("2D, UILayer, Text");
     * ```
     * Define a custom DOM layer that will not move with the camera.  (Useful for static UI elements!)
     *
     * @example
     * ```
     * Crafty.createLayer("MyCanvasLayer", "Canvas");
     * Crafty.s("MyCanvasLayer").one("RenderScene", function(){ this.everRendered = true; }); 
     * ```
     * Create a custom layer, and then bind a method to run the first time it renders.
     * * @example
     * ```
     * Crafty("MyCanvasLayer").destroy();
     * Crafty.s("MyCanvasLayer").destroy(); 
     * ```
     * For a previously defined "MyCanvasLayer", destroy it and all the entities rendered by it.
     */
    createLayer: function createLayer(name, type, options) {
        var layerTemplate = this._drawLayerTemplates[type];
        Crafty.s(name, layerTemplate, options);
        Crafty.c(name, {
            init: function () {
                this.requires("Renderable"); 
                
                // Flag to indicate that the base component doesn't need to attach a layer
                this._customLayer = true;
                this.requires(layerTemplate.type);
                this._attachToLayer(Crafty.s(name));
            },

            remove: function () {
                this._detachFromLayer();
            }
        });
    }
});