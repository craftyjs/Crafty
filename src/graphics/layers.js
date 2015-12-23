var Crafty = require('../core/core.js');

Crafty.extend({
    /**@
     * #Crafty.createLayer
     * @category Graphics
     *
     * @sign public void Crafty.createLayer(string name, object layerTemplate)
     * @param name - the name that will refer to the layer
     * @param layerTemplate - an object that implements the necessary methods for a draw layer
     * 
     * Creates a new instance of the specified type of layer.
     * 
     * @example
     * ```
     * Crafty.s("MyCanvasLayer", Crafty.canvasLayerObject)
     * Crafty.e("2D, MyCanvasLayer, Color");
     * ```
     * Define a custom canvas layer, then create an entity that uses the custom layer to render.
     */
    createLayer: function createLayer(name, layerTemplate) {
        Crafty.s(name, layerTemplate);
        Crafty.c(name, {
            init: function() {
                this.requires("Renderable");
                
                // Flag to indicate that the base component doesn't need to attach a layer
                this._customLayer = true;
                this.requires(layerTemplate.type);
                this._attachToLayer(Crafty.s(name));
            },
            
            remove: function() {
                this._detachFromLayer();
            }
        });
    }
});