var Crafty = require('./core.js'),
    document = window.document;

/**@
 * #Model
 * @category Model
 * Model is a component that offers new features for isolating business
 * logic in your application. It offers default values, dirty values,
 * and deep events on your data.
 *
 * All data should be accessed via the appropriate methods `.get`, `.set`,
 * and `.data` for the proper events to be triggered. It is not encouraged
 * to access them directly.
 *
 * Dirty values make it simple to inspect a model and see what values have changed.
 *
 * Deep events allow you to bind to specific fields, like `name` or even deep fields
 * like `contact.email` and get notified when those specific fields are updated.
 *
 * @trigger DataChange - When any data on the model has changed.
 * @trigger DataChange[key] - When the specific key on the model has changed.
 * @trigger DataChange[key.key] - The nested key value has changed.
 * @example
 * ~~~
 * Crafty.c('Person', {
 *   init: function() { this.requires('Model'); },
 *   defaults: {name: 'Fox'}
 * });
 * person = Crafty.e('Person').setup({name: 'blainesch'});
 * person.bind('ChangeData[name]', function() {
 *   console.log('name changed!');
 * });
 * person.data('name', 'blainesch'); // Triggers event
 * person.is_dirty('name'); // true
 * person.changed // name
 * ~~~
 */
Crafty.c('Model', {
  init: function() {
    this.defaults = this.defaults || {};
    this.attributes = this.extend.call(this.attributes || {}, this.defaults);
    this.original = this.attributes;
    this.changed = this.changed || [];

    this.bind('DataChange', this._changed_attributes);
    this.bind('DataChange', this._changed_triggers);
  },

  /**@
   * #.setup
   * @comp Model
   * Sets up the current model without triggering events.
   *
   * @example
   * ~~~
   * person.setup({foo: 1, bar: {baz: 2}});
   * ~~~
   */
  setup: function(data) {
    this.set.apply(this, data, {
      silent: true
    });
    return this;
  },

  /**
   * Fires more specific `DataChange` events.
   *
   * For instance a `DataChange[name]` may get fired when you
   * update the name data attribute on the model.
   */
  _changed_triggers: function(data, options) {
    var key, trigger_data;
    options = Crafty.extend.call({pre: ''}, options);
    for (key in data) {
      this.trigger('DataChange[' + options.pre + key + ']', data[key]);
      if (data[key].constructor.name === 'Object') {
        this._changed_triggers(data[key], {
          pre: options.pre + key + '.'
        });
      }
    }
  },

  /**
   * Pushes all top-levle changed attribute names to the
   * changed array.
   */
  _changed_attributes: function(data) {
    var key;
    for (key in data) {
      this.changed.push(key);
    }
    return this;
  },

  /**@
   * #.data
   * @comp Model
   * Delegates to the appropriate get/set method.
   *
   * @example
   * ~~~
   * person.data('name', 'Foxxy');
   * person.data('name'); // 'Foxxy'
   * ~~~
   *
   * @see .get
   * @see .set
   */
  data: function() {
    if (arguments.length === 1 && typeof arguments[0] === 'string') {
      return this.get.apply(this, arguments);
    } else {
      return this.set.apply(this, arguments);
    }
  },

  /**@
   * #.get
   * @comp Model
   * Getter method for data on the model.
   *
   * @example
   * ~~~
   * person.get('name'); // Foxxy
   * person.get('contact'); // {email: 'fox@example.com'}
   * person.get('contact.email'); // fox@example.com
   * ~~~
   */
  get: function(key, context) {
    var first, keys, subkey;
    if (typeof context === "undefined" || context === null) {
      context = this.attributes;
    }
    if (key.indexOf('.') > -1) {
      keys = key.split('.');
      first = keys.shift();
      subkey = keys.join('.');
      return this.get(keys.join('.'), context[first]);
    } else {
      return context[key];
    }
  },

  /**@
   * #.set
   * @comp Model
   * Main setter function for data attributes.
   *
   * Options:
   *
   * `silent`: If you want to prevent it from firing events.
   *
   * `recursive`: If you pass in an object you could overwrite
   * sibling keys, this recursively merges instead of just
   * merging it. This is `false` by default, unless you are
   * using dot notation `name.first`.
   *
   * @example
   * ~~~
   * person.set('name', 'Foxxy', {silent: true});
   * person.set('name', 'Foxxy');
   * person.set({name: 'Foxxy'}, {silent: true});
   * person.set({name: 'Foxxy'});
   * person.set('name.first', 'Foxxy');
   * ~~~
   */
  set: function() {
    var args = this._set_normalize_arguments.apply(this, arguments),
      options = args.options,
      data = args.data;

    options = Crafty.extend.call({
      recursive: typeof arguments[0] === 'string' && arguments[0].indexOf('.') > -1,
      silent: false
    }, options);

    if (!options.silent) {
      this.trigger('DataChange', data);
    }

    if (options.recursive) {
      this.attributes = this._recursive_extend(data, this.attributes);
    } else {
      this.extend.call(this.attributes, data);
    }
    return this;
  },

  /**
   * Normalizes the arguments for the `set` method.
   *
   * The set method accepts a lot of various inputs it's necessary
   * to move the argument logic out to keep it single-responsibility.
   */
  _set_normalize_arguments: function() {
    var data, length, options;
    length = arguments.length;
    if (length === 3 || (length === 2 && typeof arguments[0] === 'string')) {
      data = this._set_create_object.apply(this, arguments);
      options = arguments[2] || {};
    } else {
      data = arguments[0] || {};
      options = arguments[1] || {};
    }
    return {
      data: data,
      options: options,
    };
  },

  /**
   * If you are setting a key of 'foo.bar' or 'bar', this creates
   * the appropriate object for you to merge with the current
   * attributes.
   */
  _set_create_object: function(key, value) {
    var data = {}, keys, first, subkey;
    if (key.indexOf('.') > -1) {
      keys = key.split('.');
      first = keys.shift();
      subkey = keys.join('.');
      data[first] = this._set_create_object(subkey, value);
    } else {
      data[key] = value;
    }
    return data;
  },

  /**
   * Recursively puts `new_data` into `original_data`.
   */
  _recursive_extend: function(new_data, original_data) {
    var key;
    for (key in new_data) {
      if (new_data[key].constructor.name === 'Object') {
        original_data[key] = this._recursive_extend(new_data[key], original_data[key]);
      } else {
        original_data[key] = new_data[key];
      }
    }
    return original_data;
  },

  /**@
   * #.is_dirty
   * @comp Model
   * Helps determine when data or the entire component is "dirty" or has changed attributes.
   *
   * @example
   * ~~~
   * person = Crafty.e('Person').setup({name: 'Fox', age: 24})
   * person.is_dirty() // false
   * person.is_dirty('name') // false
   *
   * person.set('name', 'Lucky');
   * person.is_dirty(); // true
   * person.is_dirty('name'); // true
   * person.is_dirty('age'); // false
   * person.changed; // ['name']
   * ~~~
   */
  is_dirty: function(key) {
    if (arguments.length === 0) {
      return !!this.changed.length;
    } else {
      return this.changed.indexOf(key) > -1;
    }
  }
});
