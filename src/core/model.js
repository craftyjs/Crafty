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
 * @trigger Change - When any data on the model has changed.
 * @trigger Change[key] - When the specific key on the model has changed.
 * @trigger Change[key.key] - The nested key value has changed.
 * @example
 * ~~~
 * Crafty.c('Person', {
 *   name: 'Fox',
 *   init: function() { this.requires('Model'); }
 * });
 * person = Crafty.e('Person').attr({name: 'blaine'});
 * person.bind('Change[name]', function() {
 *   Crafty.log('name changed!');
 * });
 * person.attr('name', 'blainesch'); // Triggers event
 * person.is_dirty('name'); // true
 * person.changed // name
 * ~~~
 */
module.exports = {
  init: function() {
    this.changed = [];
    this.bind('Change', this._changed_attributes);
    this.bind('Change', this._changed_triggers);
  },

  /**
   * Fires more specific `Change` events.
   *
   * For instance a `Change[name]` may get fired when you
   * update the name data attribute on the model.
   */
  _changed_triggers: function(data, options) {
    var key, trigger_data;
    options = Crafty.extend.call({pre: ''}, options);
    for (key in data) {
      this.trigger('Change[' + options.pre + key + ']', data[key]);
      if (data[key].constructor === Object) {
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
   * #.is_dirty
   * @comp Model
   * Helps determine when data or the entire component is "dirty" or has changed attributes.
   *
   * @example
   * ~~~
   * person = Crafty.e('Person').attr({name: 'Fox', age: 24})
   * person.is_dirty() // false
   * person.is_dirty('name') // false
   *
   * person.attr('name', 'Lucky');
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
};

