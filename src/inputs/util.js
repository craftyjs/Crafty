var Crafty = require('../core/core.js');

// common base functionality for all EventDispatchers
Crafty.__eventDispatcher = function EventDispatcher() {};
Crafty.__eventDispatcher.prototype = {
    // this method should be setup as the entry callback for DOM events
    processEvent: function (e) {
        this.dispatchEvent(e);
        return this.preventBubbling(e);
    },

    // main method that handles logic of incoming DOM events
    // to be implemented by instances
    dispatchEvent: function (e) {
        // normalize the event and prepare it for dispatching to Crafty, a system or entities
        // set e.eventName to proper event to be triggered

        // dispatch the element to Crafty, the proper system or entities
        // find the entity to dispatch to (e.g. mouse events) or dispatch it globally (e.g. key events)
    },

    // prevents interaction with page (e.g. scrolling of page), if DOM events target Crafty's stage
    // automatically called for all incoming DOM events
    preventBubbling: function (e) {
        // only prevent something if DOM event targets Crafty's stage
        // prevent bubbling up for all events except key events backspace and F1-F12.
        // prevent default actions for all events except key events backspace and F1-F12 and except actions on INPUT and TEXTAREA.
        // Among others this prevent the arrow keys from scrolling the parent page of an iframe hosting the game
        if (Crafty.selected && !(e.key === 8 || e.key >= 112 && e.key <= 135)) {
            if (e.stopPropagation) e.stopPropagation();
            else e.cancelBubble = true;

            // Don't prevent default actions if target node is input or textarea.
            if (!e.target || (e.target.nodeName !== 'INPUT' && e.target.nodeName !== 'TEXTAREA')) {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }
                return false;
            }
            return true;
        }
    }
};


Crafty.extend({
    /**@
     * #Crafty.selected
     * @category Input
     * @kind Property
     * @trigger CraftyFocus - is triggered when Crafty's stage gets selected
     * @trigger CraftyBlur - is triggered when Crafty's stage is no longer selected
     *
     * Check whether Crafty's stage (`Crafty.stage.elem`) is currently selected.
     *
     * After a click occurs inside Crafty's stage, this property is set to `true`.
     * After a click occurs outside Crafty's stage, this property is set to `false`.
     *
     * Defaults to true.
     *
     * @see Crafty.stage#Crafty.stage.elem
     */
    selected: true,

    detectBlur: function (e) {
        var selected = ((e.clientX > Crafty.stage.x && e.clientX < Crafty.stage.x + Crafty.viewport.width) &&
            (e.clientY > Crafty.stage.y && e.clientY < Crafty.stage.y + Crafty.viewport.height));

        if (!Crafty.selected && selected) {
            Crafty.trigger("CraftyFocus");
        }

        if (Crafty.selected && !selected) {
            Crafty.trigger("CraftyBlur");
        }

        Crafty.selected = selected;
    }
});
