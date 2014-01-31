var version = require('./version');

/**@
 * #Crafty
 * @category Core
 * Select a set of or single entities by components or an entity's ID.
 *
 * Crafty uses syntax similar to jQuery by having a selector engine to select entities by their components.
 *
 * If there is more than one match, the return value is an Array-like object listing the ID numbers of each matching entity. If there is exactly one match, the entity itself is returned. If you're not sure how many matches to expect, check the number of matches via Crafty(...).length. Alternatively, use Crafty(...).each(...), which works in all cases.
 *
 * @example
 * ~~~
 *    Crafty("MyComponent")
 *    Crafty("Hello 2D Component")
 *    Crafty("Hello, 2D, Component")
 * ~~~
 *
 * The first selector will return all entities that have the component `MyComponent`. The second will return all entities that have `Hello` and `2D` and `Component` whereas the last will return all entities that have at least one of those components (or).
 *
 * ~~~
 *   Crafty("*")
 * ~~~
 * Passing `*` will select all entities.
 *
 * ~~~
 *   Crafty(1)
 * ~~~
 * Passing an integer will select the entity with that `ID`.
 *
 * To work directly with an array of entities, use the `get()` method on a selection.
 * To call a function in the context of each entity, use the `.each()` method.
 *
 * The event related methods such as `bind` and `trigger` will work on selections of entities.
 *
 * @see .get
 * @see .each
 */

var Crafty = function (selector) {
    return new Crafty.fn.init(selector);
},
    // Internal variables
    GUID, frame, components, entities, handlers, onloads,
    slice, rlist, rspace, milliSecPerFrame;


    initState = function () {
        GUID = 1, //GUID for entity IDs
        frame = 0;

        components = {}; //map of components and their functions
        entities = {}; //map of entities and their data
        handlers = {}; //global event handlers
        onloads = []; //temporary storage of onload handlers

        slice = Array.prototype.slice;
        rlist = /\s*,\s*/;
        rspace = /\s+/;
    };

initState();

/**@
 * #Crafty Core
 * @category Core
 * @trigger NewEntityName - After setting new name for entity - String - entity name
 * @trigger NewComponent - when a new component is added to the entity - String - Component
 * @trigger RemoveComponent - when a component is removed from the entity - String - Component
 * @trigger Remove - when the entity is removed by calling .destroy()
 *
 * Set of methods added to every single entity.
 */
Crafty.fn = Crafty.prototype = {

    init: function (selector) {
        //select entities by component
        if (typeof selector === "string") {
            var elem = 0, //index elements
                e, //entity forEach
                current,
                and = false, //flags for multiple
                or = false,
                del,
                comps,
                score,
                i, l;

            if (selector === '*') {
                i = 0;
                for (e in entities) {
                    // entities is something like {2:entity2, 3:entity3, 11:entity11, ...}
                    // The for...in loop sets e to "2", "3", "11", ... i.e. all
                    // the entity ID numbers. e is a string, so +e converts to number type.
                    this[i] = +e;
                    i++;
                }
                this.length = i;
                // if there's only one entity, return the actual entity
                if (i === 1) {
                    return entities[this[0]];
                }
                return this;
            }

            //multiple components OR
            if (selector.indexOf(',') !== -1) {
                or = true;
                del = rlist;
                //deal with multiple components AND
            } else if (selector.indexOf(' ') !== -1) {
                and = true;
                del = rspace;
            }

            //loop over entities
            for (e in entities) {
                if (!entities.hasOwnProperty(e)) continue; //skip
                current = entities[e];

                if (and || or) { //multiple components
                    comps = selector.split(del);
                    i = 0;
                    l = comps.length;
                    score = 0;

                    for (; i < l; i++) //loop over components
                        if (current.__c[comps[i]]) score++; //if component exists add to score

                        //if anded comps and has all OR ored comps and at least 1
                    if (and && score === l || or && score > 0) this[elem++] = +e;

                } else if (current.__c[selector]) this[elem++] = +e; //convert to int
            }

            //extend all common components
            if (elem > 0 && !and && !or) this.extend(components[selector]);
            if (comps && and)
                for (i = 0; i < l; i++) this.extend(components[comps[i]]);

            this.length = elem; //length is the last index (already incremented)

            // if there's only one entity, return the actual entity
            if (elem === 1) {
                return entities[this[elem - 1]];
            }

        } else { //Select a specific entity

            if (!selector) { //nothin passed creates God entity
                selector = 0;
                if (!(selector in entities)) entities[selector] = this;
            }

            //if not exists, return undefined
            if (!(selector in entities)) {
                this.length = 0;
                return this;
            }

            this[0] = selector;
            this.length = 1;

            //update from the cache
            if (!this.__c) this.__c = {};

            //update to the cache if NULL
            if (!entities[selector]) entities[selector] = this;
            return entities[selector]; //return the cached selector
        }

        return this;
    },

    /**@
     * #.setName
     * @comp Crafty Core
     * @sign public this .setName(String name)
     * @param name - A human readable name for debugging purposes.
     *
     * @example
     * ~~~
     * this.setName("Player");
     * ~~~
     */
    setName: function (name) {
        var entityName = String(name);

        this._entityName = entityName;

        this.trigger("NewEntityName", entityName);
        return this;
    },

    /**@
     * #.addComponent
     * @comp Crafty Core
     * @sign public this .addComponent(String componentList)
     * @param componentList - A string of components to add separated by a comma `,`
     * @sign public this .addComponent(String Component1[, .., String ComponentN])
     * @param Component# - Component ID to add.
     * Adds a component to the selected entities or entity.
     *
     * Components are used to extend the functionality of entities.
     * This means it will copy properties and assign methods to
     * augment the functionality of the entity.
     *
     * For adding multiple components, you can either pass a string with
     * all the component names (separated by commas), or pass each component name as
     * an argument.
     *
     * If the component has a function named `init` it will be called.
     *
     * If the entity already has the component, the component is skipped (nothing happens).
     *
     * @example
     * ~~~
     * this.addComponent("2D, Canvas");
     * this.addComponent("2D", "Canvas");
     * ~~~
     */
    addComponent: function (id) {
        var uninit = [],
            c = 0,
            ul, //array of components to init
            i = 0,
            l, comps, comp;

        //add multiple arguments
        if (arguments.length > 1) {
            l = arguments.length;
            for (; i < l; i++) {
                uninit.push(arguments[i]);
            }
            //split components if contains comma
        } else if (id.indexOf(',') !== -1) {
            comps = id.split(rlist);
            l = comps.length;
            for (; i < l; i++) {
                uninit.push(comps[i]);
            }
            //single component passed
        } else {
            uninit.push(id);
        }

        //extend the components
        ul = uninit.length;
        for (; c < ul; c++) {
            if (this.__c[uninit[c]] === true)
                continue;
            this.__c[uninit[c]] = true;
            comp = components[uninit[c]];
            this.extend(comp);
            //if constructor, call it
            if (comp && "init" in comp) {
                comp.init.call(this);
            }
        }

        this.trigger("NewComponent", uninit);
        return this;
    },

    /**@
     * #.toggleComponent
     * @comp Crafty Core
     * @sign public this .toggleComponent(String ComponentList)
     * @param ComponentList - A string of components to add or remove separated by a comma `,`
     * @sign public this .toggleComponent(String Component1[, .., String componentN])
     * @param Component# - Component ID to add or remove.
     * Add or Remove Components from an entity.
     *
     * @example
     * ~~~
     * var e = Crafty.e("2D,DOM,Test");
     * e.toggleComponent("Test,Test2"); //Remove Test, add Test2
     * e.toggleComponent("Test,Test2"); //Add Test, remove Test2
     * ~~~
     *
     * ~~~
     * var e = Crafty.e("2D,DOM,Test");
     * e.toggleComponent("Test","Test2"); //Remove Test, add Test2
     * e.toggleComponent("Test","Test2"); //Add Test, remove Test2
     * e.toggleComponent("Test");         //Remove Test
     * ~~~
     */
    toggleComponent: function (toggle) {
        var i = 0,
            l, comps;
        if (arguments.length > 1) {
            l = arguments.length;

            for (; i < l; i++) {
                if (this.has(arguments[i])) {
                    this.removeComponent(arguments[i]);
                } else {
                    this.addComponent(arguments[i]);
                }
            }
            //split components if contains comma
        } else if (toggle.indexOf(',') !== -1) {
            comps = toggle.split(rlist);
            l = comps.length;
            for (; i < l; i++) {
                if (this.has(comps[i])) {
                    this.removeComponent(comps[i]);
                } else {
                    this.addComponent(comps[i]);
                }
            }

            //single component passed
        } else {
            if (this.has(toggle)) {
                this.removeComponent(toggle);
            } else {
                this.addComponent(toggle);
            }
        }

        return this;
    },

    /**@
     * #.requires
     * @comp Crafty Core
     * @sign public this .requires(String componentList)
     * @param componentList - List of components that must be added
     *
     * Makes sure the entity has the components listed. If the entity does not
     * have the component, it will add it.
     *
     * (In the current version of Crafty, this function behaves exactly the same
     * as `addComponent`. By convention, developers have used `requires` for
     * component dependencies -- i.e. to indicate specifically that one component
     * will only work properly if another component is present -- and used
     * `addComponent` in all other situations.)
     *
     * @see .addComponent
     */
    requires: function (list) {
        return this.addComponent(list);
    },

    /**@
     * #.removeComponent
     * @comp Crafty Core
     * @sign public this .removeComponent(String Component[, soft])
     * @param component - Component to remove
     * @param soft - Whether to soft remove it (defaults to `true`)
     *
     * Removes a component from an entity. A soft remove (the default) will only
     * refrain `.has()` from returning true. Hard will remove all
     * associated properties and methods.
     *
     * @example
     * ~~~
     * var e = Crafty.e("2D,DOM,Test");
     * e.removeComponent("Test");        //Soft remove Test component
     * e.removeComponent("Test", false); //Hard remove Test component
     * ~~~
     */
    removeComponent: function (id, soft) {
        var comp = components[id];
        this.trigger("RemoveComponent", id);
        if (comp && "remove" in comp) {
            comp.remove.call(this, false);
        }
        if (soft === false && comp) {
            for (var prop in comp) {
                delete this[prop];
            }
        }
        delete this.__c[id];


        return this;
    },

    /**@
     * #.getId
     * @comp Crafty Core
     * @sign public Number .getId(void)
     * Returns the ID of this entity.
     *
     * For better performance, simply use the this[0] property.
     *
     * @example
     * Finding out the `ID` of an entity can be done by returning the property `0`.
     * ~~~
     *    var ent = Crafty.e("2D");
     *    ent[0]; //ID
     *    ent.getId(); //also ID
     * ~~~
     */
    getId: function () {
        return this[0];
    },

    /**@
     * #.has
     * @comp Crafty Core
     * @sign public Boolean .has(String component)
     * Returns `true` or `false` depending on if the
     * entity has the given component.
     *
     * For better performance, simply use the `.__c` object
     * which will be `true` if the entity has the component or
     * will not exist (or be `false`).
     */
    has: function (id) {
        return !!this.__c[id];
    },

    /**@
     * #.attr
     * @comp Crafty Core
     * @sign public this .attr(String property, * value)
     * @param property - Property of the entity to modify
     * @param value - Value to set the property to
     * @sign public this .attr(Object map)
     * @param map - Object where the key is the property to modify and the value as the property value
     * @trigger Change - when properties change - {key: value}
     *
     * Use this method to set any property of the entity.
     *
     * @example
     * ~~~
     * this.attr({key: "value", prop: 5});
     * this.key; //value
     * this.prop; //5
     *
     * this.attr("key", "newvalue");
     * this.key; //newvalue
     * ~~~
     */
    attr: function (key, value) {
        if (arguments.length === 1) {
            //if just the key, return the value
            if (typeof key === "string") {
                return this[key];
            }

            //extend if object
            this.extend(key);
            this.trigger("Change", key); //trigger change event
            return this;
        }
        //if key value pair
        this[key] = value;

        var change = {};
        change[key] = value;
        this.trigger("Change", change); //trigger change event
        return this;
    },

    /**@
     * #.toArray
     * @comp Crafty Core
     * @sign public this .toArray(void)
     *
     * This method will simply return the found entities as an array of ids.  To get an array of the actual entities, use `get()`.
     * @see .get
     */
    toArray: function () {
        return slice.call(this, 0);
    },

    /**@
    * #.timeout
    * @comp Crafty Core
    * @sign public this .timeout(Function callback, Number delay)
    * @param callback - Method to execute after given amount of milliseconds
    * @param delay - Amount of milliseconds to execute the method
    *
    * The delay method will execute a function after a given amount of time in milliseconds.
    *
    * Essentially a wrapper for `setTimeout`.
    *
    * @example
    * Destroy itself after 100 milliseconds
    * ~~~
    * this.timeout(function() {
         this.destroy();
    * }, 100);
    * ~~~
    */
    timeout: function (callback, duration) {
        this.each(function () {
            var self = this;
            setTimeout(function () {
                callback.call(self);
            }, duration);
        });
        return this;
    },

    /**@
     * #.bind
     * @comp Crafty Core
     * @sign public this .bind(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute when the event is triggered
     * Attach the current entity (or entities) to listen for an event.
     *
     * Callback will be invoked when an event with the event name passed
     * is triggered. Depending on the event, some data may be passed
     * via an argument to the callback function.
     *
     * The first argument is the event name (can be anything) whilst the
     * second argument is the callback. If the event has data, the
     * callback should have an argument.
     *
     * Events are arbitrary and provide communication between components.
     * You can trigger or bind an event even if it doesn't exist yet.
     *
     * Unlike DOM events, Crafty events are exectued synchronously.
     *
     * @example
     * ~~~
     * this.attr("triggers", 0); //set a trigger count
     * this.bind("myevent", function() {
     *     this.triggers++; //whenever myevent is triggered, increment
     * });
     * this.bind("EnterFrame", function() {
     *     this.trigger("myevent"); //trigger myevent on every frame
     * });
     * ~~~
     *
     * @see .trigger, .unbind
     */
    bind: function (event, callback) {

        // (To learn how the handlers object works, see inline comment at Crafty.bind)

        //optimization for 1 entity
        if (this.length === 1) {
            if (!handlers[event]) handlers[event] = {};
            var h = handlers[event];

            if (!h[this[0]]) h[this[0]] = []; //init handler array for entity
            h[this[0]].push(callback); //add current callback
            return this;
        }

        this.each(function () {
            //init event collection
            if (!handlers[event]) handlers[event] = {};
            var h = handlers[event];

            if (!h[this[0]]) h[this[0]] = []; //init handler array for entity
            h[this[0]].push(callback); //add current callback
        });
        return this;
    },

    /**@
     * #.uniqueBind
     * @comp Crafty Core
     * @sign public Number .uniqueBind(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns ID of the current callback used to unbind
     *
     * Works like Crafty.bind, but prevents a callback from being bound multiple times.
     *
     * @see .bind
     */
    uniqueBind: function (event, callback) {
        this.unbind(event, callback);
        this.bind(event, callback);

    },

    /**@
     * #.one
     * @comp Crafty Core
     * @sign public Number one(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns ID of the current callback used to unbind
     *
     * Works like Crafty.bind, but will be unbound once the event triggers.
     *
     * @see .bind
     */
    one: function (event, callback) {
        var self = this;
        var oneHandler = function (data) {
            callback.call(self, data);
            self.unbind(event, oneHandler);
        };
        return self.bind(event, oneHandler);

    },

    /**@
     * #.unbind
     * @comp Crafty Core
     * @sign public this .unbind(String eventName[, Function callback])
     * @param eventName - Name of the event to unbind
     * @param callback - Function to unbind
     * Removes binding with an event from current entity.
     *
     * Passing an event name will remove all events bound to
     * that event. Passing a reference to the callback will
     * unbind only that callback.
     * @see .bind, .trigger
     */
    unbind: function (event, callback) {
        // (To learn how the handlers object works, see inline comment at Crafty.bind)
        this.each(function () {
            var hdl = handlers[event],
                i = 0,
                l, current;
            //if no events, cancel
            if (hdl && hdl[this[0]]) l = hdl[this[0]].length;
            else return this;

            //if no function, delete all
            if (!callback) {
                delete hdl[this[0]];
                return this;
            }
            //look for a match if the function is passed
            for (; i < l; i++) {
                current = hdl[this[0]];
                if (current[i] == callback) {
                    delete current[i];
                }
            }
        });

        return this;
    },

    /**@
     * #.trigger
     * @comp Crafty Core
     * @sign public this .trigger(String eventName[, Object data])
     * @param eventName - Event to trigger
     * @param data - Arbitrary data that will be passed into every callback as an argument
     * Trigger an event with arbitrary data. Will invoke all callbacks with
     * the context (value of `this`) of the current entity object.
     *
     * *Note: This will only execute callbacks within the current entity, no other entity.*
     *
     * The first argument is the event name to trigger and the optional
     * second argument is the arbitrary event data. This can be absolutely anything.
     *
     * Unlike DOM events, Crafty events are exectued synchronously.
     */
    trigger: function (event, data) {
        // (To learn how the handlers object works, see inline comment at Crafty.bind)
        if (this.length === 1) {
            //find the handlers assigned to the event and entity
            if (handlers[event] && handlers[event][this[0]]) {
                var callbacks = handlers[event][this[0]],
                    i;
                for (i = 0; i < callbacks.length; i++) {
                    if (typeof callbacks[i] === "undefined") {
                        callbacks.splice(i, 1);
                        i--;
                    } else {
                        callbacks[i].call(this, data);
                    }
                }
            }
            return this;
        }

        this.each(function () {
            //find the handlers assigned to the event and entity
            if (handlers[event] && handlers[event][this[0]]) {
                var callbacks = handlers[event][this[0]],
                    i;
                for (i = 0; i < callbacks.length; i++) {
                    if (typeof callbacks[i] === "undefined") {
                        callbacks.splice(i, 1);
                        i--;
                    } else {
                        callbacks[i].call(this, data);
                    }
                }
            }
        });
        return this;
    },

    /**@
     * #.each
     * @comp Crafty Core
     * @sign public this .each(Function method)
     * @param method - Method to call on each iteration
     * Iterates over found entities, calling a function for every entity.
     *
     * The function will be called for every entity and will pass the index
     * in the iteration as an argument. The context (value of `this`) of the
     * function will be the current entity in the iteration.
     *
     * @example
     * Destroy every second 2D entity
     * ~~~
     * Crafty("2D").each(function(i) {
     *     if(i % 2 === 0) {
     *         this.destroy();
     *     }
     * });
     * ~~~
     */
    each: function (func) {
        var i = 0,
            l = this.length;
        for (; i < l; i++) {
            //skip if not exists
            if (!entities[this[i]]) continue;
            func.call(entities[this[i]], i);
        }
        return this;
    },

    /**@
     * #.get
     * @comp Crafty Core
     * @sign public Array .get()
     * @returns An array of entities corresponding to the active selector
     * 
     * @sign public Entity .get(Number index)
     * @returns an entity belonging to the current selection
     * @param index - The index of the entity to return.  If negative, counts back from the end of the array.
     * 
     *
     * @example
     * Get an array containing every "2D" entity
     * ~~~
     * var arr = Crafty("2D").get()
     * ~~~
     * Get the first entity matching the selector
     * ~~~
     * // equivalent to Crafty("2D").get()[0], but doesn't create a new array
     * var e = Crafty("2D").get(0)
     * ~~~
     * Get the last "2D" entity matching the selector
     * ~~~
     * var e = Crafty("2D").get(-1)
     * ~~~
     * 
     */
    get: function(index) {
        var l = this.length;
        if (typeof index !== "undefined") {
            if (index >= l || index+l < 0)
                return undefined;
            if (index>=0)
                return entities[this[index]];
            else
                return entities[this[index+l]];
        } else {
            var i=0, result = [];
            for (; i < l; i++) {
                //skip if not exists
                if (!entities[this[i]]) continue;
                result.push( entities[this[i]] );
            }
            return result;
        }
    },

    /**@
     * #.clone
     * @comp Crafty Core
     * @sign public Entity .clone(void)
     * @returns Cloned entity of the current entity
     *
     * Method will create another entity with the exact same
     * properties, components and methods as the current entity.
     */
    clone: function () {
        var comps = this.__c,
            comp,
            prop,
            clone = Crafty.e();

        for (comp in comps) {
            clone.addComponent(comp);
        }
        for (prop in this) {
            if (prop != "0" && prop != "_global" && prop != "_changed" && typeof this[prop] != "function" && typeof this[prop] != "object") {
                clone[prop] = this[prop];
            }
        }

        return clone;
    },

    /**@
     * #.setter
     * @comp Crafty Core
     * @sign public this .setter(String property, Function callback)
     * @param property - Property to watch for modification
     * @param callback - Method to execute if the property is modified
     * Will watch a property waiting for modification and will then invoke the
     * given callback when attempting to modify.
     *
     */
    setter: function (prop, callback) {
        if (Crafty.support.setter) {
            this.__defineSetter__(prop, callback);
        } else if (Crafty.support.defineProperty) {
            Object.defineProperty(this, prop, {
                set: callback,
                configurable: true
            });
        }
        return this;
    },

    /**@
     * #.destroy
     * @comp Crafty Core
     * @sign public this .destroy(void)
     * Will remove all event listeners and delete all properties as well as removing from the stage
     */
    destroy: function () {
        //remove all event handlers, delete from entities
        this.each(function () {
            var comp;
            this.trigger("Remove");
            for (var compName in this.__c) {
                comp = components[compName];
                if (comp && "remove" in comp)
                    comp.remove.call(this, true);
            }
            for (var e in handlers) {
                this.unbind(e);
            }
            delete entities[this[0]];
        });
    }
};

//give the init instances the Crafty prototype
Crafty.fn.init.prototype = Crafty.fn;


/**@
 * #Crafty.extend
 * @category Core
 * Used to extend the Crafty namespace.
 *
 */
Crafty.extend = Crafty.fn.extend = function (obj) {
    var target = this,
        key;

    //don't bother with nulls
    if (!obj) return target;

    for (key in obj) {
        if (target === obj[key]) continue; //handle circular reference
        target[key] = obj[key];
    }

    return target;
};


Crafty.extend({
    /**@
     * #Crafty.init
     * @category Core
     * @trigger Load - Just after the viewport is initialised. Before the EnterFrame loops is started
     * @sign public this Crafty.init([Number width, Number height, String stage_elem])
     * @sign public this Crafty.init([Number width, Number height, HTMLElement stage_elem])
     * @param Number width - Width of the stage
     * @param Number height - Height of the stage
     * @param String or HTMLElement stage_elem - the element to use for the stage
     *
     * Sets the element to use as the stage, creating it if necessary.  By default a div with id 'cr-stage' is used, but if the 'stage_elem' argument is provided that will be used instead.  (see `Crafty.viewport.init`)
     *
     * Starts the `EnterFrame` interval. This will call the `EnterFrame` event for every frame.
     *
     * Can pass width and height values for the stage otherwise will default to window size (see `Crafty.DOM.window`).
     *
     * All `Load` events will be executed.
     *
     * Uses `requestAnimationFrame` to sync the drawing with the browser but will default to `setInterval` if the browser does not support it.
     * @see Crafty.stop,  Crafty.viewport
     */
    init: function (w, h, stage_elem) {
        Crafty.viewport.init(w, h, stage_elem);

        //call all arbitrary functions attached to onload
        this.trigger("Load");
        this.timer.init();

        return this;
    },

    /**@
     * #Crafty.getVersion
     * @category Core
     * @sign public String Crafty.getVersion()
     * @returns Current version of Crafty as a string
     *
     * Return current version of crafty
     *
     * @example
     * ~~~
     * Crafty.getVersion(); //'0.5.2'
     * ~~~
     */
    getVersion: function () {
        return version;
    },

    /**@
     * #Crafty.stop
     * @category Core
     * @trigger CraftyStop - when the game is stopped
     * @sign public this Crafty.stop([bool clearState])
     * @param clearState - if true the stage and all game state is cleared.
     *
     * Stops the EnterFrame interval and removes the stage element.
     *
     * To restart, use `Crafty.init()`.
     * @see Crafty.init
     */
    stop: function (clearState) {
        this.timer.stop();
        if (clearState) {
            Crafty.audio.remove();
            if (Crafty.stage && Crafty.stage.elem.parentNode) {
                var newCrStage = document.createElement('div');
                newCrStage.id = Crafty.stage.elem.id;
                Crafty.stage.elem.parentNode.replaceChild(newCrStage, Crafty.stage.elem);
            }
            initState();
        }

        Crafty.trigger("CraftyStop");

        return this;
    },

    /**@
     * #Crafty.pause
     * @category Core
     * @trigger Pause - when the game is paused
     * @trigger Unpause - when the game is unpaused
     * @sign public this Crafty.pause(void)
     *
     * Pauses the game by stopping the EnterFrame event from firing. If the game is already paused it is unpaused.
     * You can pass a boolean parameter if you want to pause or unpause mo matter what the current state is.
     * Modern browsers pauses the game when the page is not visible to the user. If you want the Pause event
     * to be triggered when that happens you can enable autoPause in `Crafty.settings`.
     *
     * @example
     * Have an entity pause the game when it is clicked.
     * ~~~
     * button.bind("click", function() {
     *     Crafty.pause();
     * });
     * ~~~
     */
    pause: function (toggle) {
        if (arguments.length === 1 ? toggle : !this._paused) {
            this.trigger('Pause');
            this._paused = true;
            setTimeout(function () {
                Crafty.timer.stop();
            }, 0);
            Crafty.keydown = {};
        } else {
            this.trigger('Unpause');
            this._paused = false;
            setTimeout(function () {
                Crafty.timer.init();
            }, 0);
        }
        return this;
    },

    /**@
     * #Crafty.isPaused
     * @category Core
     * @sign public this Crafty.isPaused()
     *
     * Check whether the game is already paused or not.
     *
     * @example
     * ~~~
     * Crafty.isPaused();
     * ~~~
     */
    isPaused: function () {
        return this._paused;
    },

    /**@
     * #Crafty.timer
     * @category Game Loop
     * Handles game ticks
     */
    timer: (function () {
        /*
         * `window.requestAnimationFrame` or its variants is called for animation.
         * `.requestID` keeps a record of the return value previous `window.requestAnimationFrame` call.
         * This is an internal variable. Used to stop frame.
         */
        var tick, requestID;

        // Internal variables used to control the game loop.  Use Crafty.timer.steptype() to set these.
        var mode = "fixed",
            maxFramesPerStep = 5,
            maxTimestep = 40;

        // variables used by the game loop to track state
        var endTime = 0,
            timeSlip = 0,
            gameTime;

        // Controls the target rate of fixed mode loop.  Set these with the Crafty.timer.FPS function
        var FPS = 50,
            milliSecPerFrame = 1000 / FPS;




        return {
            init: function () {
                // When first called, set the  gametime one frame before now!
                if (typeof gameTime === "undefined")
                    gameTime = (new Date().getTime()) - milliSecPerFrame;
                var onFrame = window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    null;

                if (onFrame) {
                    tick = function () {
                        Crafty.timer.step();
                        requestID = onFrame(tick);
                        //console.log(requestID + ', ' + frame)
                    };

                    tick();
                } else {
                    tick = setInterval(function () {
                        Crafty.timer.step();
                    }, 1000 / FPS);
                }
            },

            stop: function () {
                Crafty.trigger("CraftyStopTimer");

                if (typeof tick === "number") clearInterval(tick);

                var onFrame = window.cancelRequestAnimationFrame ||
                    window.webkitCancelRequestAnimationFrame ||
                    window.mozCancelRequestAnimationFrame ||
                    window.oCancelRequestAnimationFrame ||
                    window.msCancelRequestAnimationFrame ||
                    null;

                if (onFrame) onFrame(requestID);
                tick = null;
            },


            /**@
             * #Crafty.timer.steptype
             * @comp Crafty.timer
             * @sign public void Crafty.timer.steptype(mode [, maxTimeStep])
             * Can be called to set the type of timestep the game loop uses
             * @param mode - the type of time loop.  Allowed values are "fixed", "semifixed", and "variable".  Crafty defaults to "fixed".
             * @param mode - For "fixed", sets the max number of frames per step.   For "variable" and "semifixed", sets the maximum time step allowed.
             *
             * * In "fixed" mode, each frame is sent the same value of `dt`, and to achieve the target game speed, mulitiple frame events are triggered before each render.
             * * In "variable" mode, there is only one frame triggered per render.  This recieves a value of `dt` equal to the actual elapsed time since the last frame.
             * * In "semifixed" mode, multiple frames per render are processed, and the total time since the last frame is divided evenly between them.
             *
             */

            steptype: function (newmode, option) {
                if (newmode === "variable" || newmode === "semifixed") {
                    mode = newmode;
                    if (option)
                        maxTimestep = option;

                } else if (newmode === "fixed") {
                    mode = "fixed";
                    if (option)
                        maxFramesPerStep = option;
                } else {
                    throw "Invalid step type specified";
                }


            },

            /**@
             * #Crafty.timer.step
             * @comp Crafty.timer
             * @sign public void Crafty.timer.step()
             * @trigger EnterFrame - Triggered on each frame.  Passes the frame number, and the amount of time since the last frame.  If the time is greater than maxTimestep, that will be used instead.  (The default value of maxTimestep is 50 ms.) - { frame: Number, dt:Number }
             * @trigger RenderScene - Triggered every time a scene should be rendered
             * @trigger MeasureWaitTime - Triggered at the beginning of each step after the first.  Passes the time the game loop waited between steps. - Number
             * @trigger MeasureFrameTime - Triggered after each step.  Passes the time it took to advance one frame. - Number
             * @trigger MeasureRenderTime - Triggered after each render. Passes the time it took to render the scene - Number
             * Advances the game by triggering `EnterFrame` and `RenderScene`
             */
            step: function () {
                var drawTimeStart, dt, lastFrameTime, loops = 0;

                currentTime = new Date().getTime();
                if (endTime > 0)
                    Crafty.trigger("MeasureWaitTime", currentTime - endTime);

                // If we're currently ahead of the current time, we need to wait until we're not!
                if (gameTime + timeSlip >= currentTime) {
                    endTime = currentTime;
                    return;
                }

                var netTimeStep = currentTime - (gameTime + timeSlip);
                // We try to keep up with the target FPS by processing multiple frames per render
                // If we're hopelessly behind, stop trying to catch up.
                if (netTimeStep > milliSecPerFrame * 20) {
                    //gameTime = currentTime - milliSecPerFrame;
                    timeSlip += netTimeStep - milliSecPerFrame;
                    netTimeStep = milliSecPerFrame;
                }

                // Set up how time is incremented
                if (mode === "fixed") {
                    loops = Math.ceil(netTimeStep / milliSecPerFrame);
                    // maxFramesPerStep adjusts how willing we are to delay drawing in order to keep at the target FPS
                    loops = Math.min(loops, maxFramesPerStep);
                    dt = milliSecPerFrame;
                } else if (mode === "variable") {
                    loops = 1;
                    dt = netTimeStep;
                    // maxTimestep is the maximum time to be processed in a frame.  (Large dt => unstable physics)
                    dt = Math.min(dt, maxTimestep);
                } else if (mode === "semifixed") {
                    loops = Math.ceil(netTimeStep / maxTimestep);
                    dt = netTimeStep / loops;
                }

                // Process frames, incrementing the game clock with each frame.
                // dt is determined by the mode
                for (var i = 0; i < loops; i++) {
                    lastFrameTime = currentTime;
                    // Everything that changes over time hooks into this event
                    Crafty.trigger("EnterFrame", {
                        frame: frame++,
                        dt: dt,
                        gameTime: gameTime
                    });
                    gameTime += dt;
                    currentTime = new Date().getTime();
                    Crafty.trigger("MeasureFrameTime", currentTime - lastFrameTime);
                }

                //If any frames were processed, render the results
                if (loops > 0) {
                    drawTimeStart = currentTime;
                    Crafty.trigger("RenderScene");
                    // Post-render cleanup opportunity
                    Crafty.trigger("PostRender");
                    currentTime = new Date().getTime();
                    Crafty.trigger("MeasureRenderTime", currentTime - drawTimeStart);
                }

                endTime = currentTime;
            },
            /**@
             * #Crafty.timer.FPS
             * @comp Crafty.timer
             * @sign public void Crafty.timer.FPS()
             * Returns the target frames per second. This is not an actual frame rate.
             * @sign public void Crafty.timer.FPS(Number value)
             * @param value - the target rate
             * Sets the target frames per second. This is not an actual frame rate.
             * The default rate is 50.
             */
            FPS: function (value) {
                if (typeof value == "undefined")
                    return FPS;
                else {
                    FPS = value;
                    milliSecPerFrame = 1000 / FPS;
                }
            },

            /**@
             * #Crafty.timer.simulateFrames
             * @comp Crafty.timer
             * @sign public this Crafty.timer.simulateFrames(Number frames[, Number timestep])
             * Advances the game state by a number of frames and draws the resulting stage at the end. Useful for tests and debugging.
             * @param frames - number of frames to simulate
             * @param timestep - the duration to pass each frame.  Defaults to milliSecPerFrame (20 ms) if not specified.
             */
            simulateFrames: function (frames, timestep) {
                if (typeof timestep === "undefined")
                    timestep = milliSecPerFrame;
                while (frames-- > 0) {
                    Crafty.trigger("EnterFrame", {
                        frame: frame++,
                        dt: timestep
                    });
                }
                Crafty.trigger("RenderScene");
            }
        };
    })(),


    /**@
     * #Crafty.e
     * @category Core
     * @trigger NewEntity - When the entity is created and all components are added - { id:Number }
     * @sign public Entity Crafty.e(String componentList)
     * @param componentList - List of components to assign to new entity
     * @sign public Entity Crafty.e(String component1[, .., String componentN])
     * @param component# - Component to add
     *
     * Creates an entity. Any arguments will be applied in the same
     * way `.addComponent()` is applied as a quick way to add components.
     *
     * Any component added will augment the functionality of
     * the created entity by assigning the properties and methods from the component to the entity.
     *
     * @example
     * ~~~
     * var myEntity = Crafty.e("2D, DOM, Color");
     * ~~~
     *
     * @see Crafty.c
     */
    e: function () {
        var id = UID(),
            craft;

        entities[id] = null; //register the space
        entities[id] = craft = Crafty(id);

        if (arguments.length > 0) {
            craft.addComponent.apply(craft, arguments);
        }
        craft.setName('Entity #' + id); //set default entity human readable name
        craft.addComponent("obj"); //every entity automatically assumes obj

        Crafty.trigger("NewEntity", {
            id: id
        });

        return craft;
    },

    /**@
     * #Crafty.c
     * @category Core
     * @sign public void Crafty.c(String name, Object component)
     * @param name - Name of the component
     * @param component - Object with the component's properties and methods
     * Creates a component where the first argument is the ID and the second
     * is the object that will be inherited by entities.
     *
     * A couple of methods are treated specially. They are invoked in partiular contexts, and (in those contexts) cannot be overridden by other components.
     *
     * - `init` will be called when the component is added to an entity
     * - `remove` will be called just before a component is removed, or before an entity is destroyed. It is passed a single boolean parameter that is `true` if the entity is being destroyed.
     *
     * In addition to these hardcoded special methods, there are some conventions for writing components.
     *
     * - Properties or methods that start with an underscore are considered private.
     * - A method with the same name as the component is considered to be a constructor
     * and is generally used when you need to pass configuration data to the component on a per entity basis.
     *
     * @example
     * ~~~
     * Crafty.c("Annoying", {
     *     _message: "HiHi",
     *     init: function() {
     *         this.bind("EnterFrame", function() { alert(this.message); });
     *     },
     *     annoying: function(message) { this.message = message; }
     * });
     *
     * Crafty.e("Annoying").annoying("I'm an orange...");
     * ~~~
     *
     *
     * WARNING:
     *
     * in the example above the field _message is local to the entity. That is, if you create many entities with the Annoying component they can all have different values for _message. That is because it is a simple value, and simple values are copied by value. If however the field had been an object or array, the value would have been shared by all entities with the component because complex types are copied by reference in javascript. This is probably not what you want and the following example demonstrates how to work around it:
     *
     * ~~~
     * Crafty.c("MyComponent", {
     *     _iAmShared: { a: 3, b: 4 },
     *     init: function() {
     *         this._iAmNotShared = { a: 3, b: 4 };
     *     },
     * });
     * ~~~
     *
     * @see Crafty.e
     */
    c: function (compName, component) {
        components[compName] = component;
    },

    /**@
     * #Crafty.trigger
     * @category Core, Events
     * @sign public void Crafty.trigger(String eventName, * data)
     * @param eventName - Name of the event to trigger
     * @param data - Arbitrary data to pass into the callback as an argument
     *
     * This method will trigger every single callback attached to the event name. This means
     * every global event and every entity that has a callback.
     *
     * @see Crafty.bind
     */
    trigger: function (event, data) {

        // (To learn how the handlers object works, see inline comment at Crafty.bind)
        var hdl = handlers[event],
            h, i, l, callbacks, context;
        //loop over every object bound
        for (h in hdl) {

            // Check whether h needs to be processed
            if (!hdl.hasOwnProperty(h)) continue;
            callbacks = hdl[h];
            if (!callbacks || callbacks.length === 0) continue;

            //if an entity, call with that context; else the global context
            if (entities[h])
                context = Crafty(+h);
            else
                context = Crafty;

            //loop over every handler within object
            for (i = 0; i < callbacks.length; i++) {
                // Remove a callback if it has been deleted
                if (typeof callbacks[i] === "undefined") {
                    callbacks.splice(i, 1);
                    i--;
                } else
                    callbacks[i].call(context, data);
            }
        }
    },

    /**@
     * #Crafty.bind
     * @category Core, Events
     * @sign public Number bind(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns callback function which can be used for unbind
     *
     * Binds to a global event. Method will be executed when `Crafty.trigger` is used
     * with the event name.
     *
     * @see Crafty.trigger, Crafty.unbind
     */
    bind: function (event, callback) {

        // Background: The structure of the global object "handlers"
        // ---------------------------------------------------------
        // Here is an example of what "handlers" can look like:
        // handlers ===
        //    { Move:  {5:[fnA], 6:[fnB, fnC], global:[fnD]},
        //     Change: {6:[fnE]}
        //    }
        // In this example, when the 'Move' event is triggered on entity #6 (e.g.
        // entity6.trigger('Move')), it causes the execution of fnB() and fnC(). When
        // the Move event is triggered globally (i.e. Crafty.trigger('Move')), it
        // will execute fnA, fnB, fnC, fnD.
        //
        // In this example, "this" is bound to entity #6 whenever fnB() is executed, and
        // "this" is bound to Crafty whenever fnD() is executed.
        //
        // In other words, the structure of "handlers" is:
        //
        // handlers[event][entityID or 'global'] === (Array of callback functions)

        if (!handlers[event]) handlers[event] = {};
        var hdl = handlers[event];

        if (!hdl.global) hdl.global = [];
        hdl.global.push(callback);
        return callback;
    },


    /**@
     * #Crafty.uniqueBind
     * @category Core, Events
     * @sign public Number uniqueBind(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns callback function which can be used for unbind
     *
     * Works like Crafty.bind, but prevents a callback from being bound multiple times.
     *
     * @see Crafty.bind
     */
    uniqueBind: function (event, callback) {
        this.unbind(event, callback);
        return this.bind(event, callback);
    },

    /**@
     * #Crafty.one
     * @category Core, Events
     * @sign public Number one(String eventName, Function callback)
     * @param eventName - Name of the event to bind to
     * @param callback - Method to execute upon event triggered
     * @returns callback function which can be used for unbind
     *
     * Works like Crafty.bind, but will be unbound once the event triggers.
     *
     * @see Crafty.bind
     */
    one: function (event, callback) {
        var self = this;
        var oneHandler = function (data) {
            callback.call(self, data);
            self.unbind(event, oneHandler);
        };
        return self.bind(event, oneHandler);
    },

    /**@
     * #Crafty.unbind
     * @category Core, Events
     * @sign public Boolean Crafty.unbind(String eventName, Function callback)
     * @param eventName - Name of the event to unbind
     * @param callback - Function to unbind
     * @sign public Boolean Crafty.unbind(String eventName, Number callbackID)
     * @param callbackID - ID of the callback
     * @returns True or false depending on if a callback was unbound
     * Unbind any event from any entity or global event.
     * @example
     * ~~~
     *    var play_gameover_sound = function () {...};
     *    Crafty.bind('GameOver', play_gameover_sound);
     *    ...
     *    Crafty.unbind('GameOver', play_gameover_sound);
     * ~~~
     *
     * The first line defines a callback function. The second line binds that
     * function so that `Crafty.trigger('GameOver')` causes that function to
     * run. The third line unbinds that function.
     *
     * ~~~
     *    Crafty.unbind('GameOver');
     * ~~~
     *
     * This unbinds ALL global callbacks for the event 'GameOver'. That
     * includes all callbacks attached by `Crafty.bind('GameOver', ...)`, but
     * none of the callbacks attached by `some_entity.bind('GameOver', ...)`.
     */
    unbind: function (event, callback) {
        // (To learn how the handlers object works, see inline comment at Crafty.bind)
        var hdl = handlers[event],
            i, l, global_callbacks, found_match;

        if (hdl === undefined || hdl.global === undefined || hdl.global.length === 0) {
            return false;
        }

        // If no callback was supplied, delete everything
        if (arguments.length === 1) {
            delete hdl.global;
            return true;
        }

        // loop over the globally-attached events
        global_callbacks = hdl.global;
        found_match = false;
        for (i = 0, l = global_callbacks.length; i < l; i++) {
            if (global_callbacks[i] === callback) {
                found_match = true;
                delete global_callbacks[i];
            }
        }
        return found_match;
    },

    /**@
     * #Crafty.frame
     * @category Core
     * @sign public Number Crafty.frame(void)
     * Returns the current frame number
     */
    frame: function () {
        return frame;
    },

    components: function () {
        return components;
    },

    isComp: function (comp) {
        return comp in components;
    },

    debug: function (str) {
        // access internal variables - handlers or entities
        if (str === 'handlers') {
            return handlers;
        }
        return entities;
    },

    /**@
     * #Crafty.settings
     * @category Core
     * Modify the inner workings of Crafty through the settings.
     */
    settings: (function () {
        var states = {},
            callbacks = {};

        return {
            /**@
             * #Crafty.settings.register
             * @comp Crafty.settings
             * @sign public void Crafty.settings.register(String settingName, Function callback)
             * @param settingName - Name of the setting
             * @param callback - Function to execute when use modifies setting
             *
             * Use this to register custom settings. Callback will be executed when `Crafty.settings.modify` is used.
             *
             * @see Crafty.settings.modify
             */
            register: function (setting, callback) {
                callbacks[setting] = callback;
            },

            /**@
             * #Crafty.settings.modify
             * @comp Crafty.settings
             * @sign public void Crafty.settings.modify(String settingName, * value)
             * @param settingName - Name of the setting
             * @param value - Value to set the setting to
             *
             * Modify settings through this method.
             *
             * @see Crafty.settings.register, Crafty.settings.get
             */
            modify: function (setting, value) {
                if (!callbacks[setting]) return;
                callbacks[setting].call(states[setting], value);
                states[setting] = value;
            },

            /**@
             * #Crafty.settings.get
             * @comp Crafty.settings
             * @sign public * Crafty.settings.get(String settingName)
             * @param settingName - Name of the setting
             * @returns Current value of the setting
             *
             * Returns the current value of the setting.
             *
             * @see Crafty.settings.register, Crafty.settings.get
             */
            get: function (setting) {
                return states[setting];
            }
        };
    })(),

    clone: clone
});

/**
 * Return a unique ID
 */

function UID() {
    var id = GUID++;
    //if GUID is not unique
    if (id in entities) {
        return UID(); //recurse until it is unique
    }
    return id;
}

/**@
 * #Crafty.clone
 * @category Core
 * @sign public Object .clone(Object obj)
 * @param obj - an object
 *
 * Deep copy (a.k.a clone) of an object.
 */

function clone(obj) {
    if (obj === null || typeof (obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for (var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

// export Crafty
if (typeof define === 'function') { // AMD
    define('crafty', [], function () {
        return Crafty;
    });
}

module.exports = Crafty;

window.Crafty = Crafty;

