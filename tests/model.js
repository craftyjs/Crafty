module("Model", {
  setup: function() {},
  teardown: function() {
    Crafty("*").destroy();
  }
});

test("Init Defaults", function() {
  var fox, blank;
  Crafty.c('Animal', {
    defaults: {name: 'Fox'}
  });
  fox = Crafty.e('Animal, Model');
  blank = Crafty.e('Model');

  deepEqual(fox.attributes, {name: 'Fox'});
  deepEqual(blank.attributes, {});
});

test('Get', function() {
  var fox;
  Crafty.c('Animal', {
    defaults: {
      contact: {
        email: 'test@example.com',
        address: {
          city: 'Portland',
          state: 'Oregon'
        }
      },
      name: 'Fox'
    }
  });
  fox = Crafty.e('Animal, Model');

  equal(fox.get('contact.address.city'), 'Portland');
  equal(fox.get('contact.email'), 'test@example.com');
  equal(fox.get('name'), 'Fox');
});

test('Set', function() {
  var fox;
  Crafty.c('Animal', {
    defaults: {
      name: 'Fox',
      age: 24
    }
  });

  fox = Crafty.e('Animal, Model');

  fox.set('age', 0);
  equal(fox.get('age'), 0);

  fox.set('name', 'Foxxy');
  equal(fox.get('name'), 'Foxxy');

  fox.set('name', 'Slick', {});
  equal(fox.get('name'), 'Slick');

  fox.set({name: 'Lucky'});
  equal(fox.get('name'), 'Lucky');

  fox.set({name: 'Spot'}, {});
  equal(fox.get('name'), 'Spot');
});

test('Set with dot notation', function() {
  var fox;
  Crafty.c('Animal', {
    defaults: {
      contact: {
        email: 'test@example.com',
        address: {
          city: 'Portland',
          state: 'Oregon'
        }
      },
      name: 'Fox'
    }
  });
  fox = Crafty.e('Animal, Model');

  fox.set('contact.address.city', 'Salem');

  deepEqual(fox.get('contact.address'), {city: 'Salem', state: 'Oregon'});
});

test('Set Silent', function() {
  var fox, called;
  Crafty.c('Animal', {
    defaults: {name: 'Fox'}
  });

  fox = Crafty.e('Animal, Model');

  called = false;
  fox.bind('DataChange', function() {
    called = true;
  });

  fox.set({name: 'Lucky'}, {silent: true});
  equal(called, false);

  fox.set({name: 'Spot'}, {silent: false});
  equal(called, true);
});

test('Set Recursive', function() {
  var fox;
  Crafty.c('Animal', {
    defaults: {
      name: 'Fox',
      contact: {
        email: 'fox@example.com',
        phone: '555-555-4545'
      }
    }
  });

  fox = Crafty.e('Animal, Model');

  fox.set({contact: {email: 'foxxy@example.com'}}, {recursive: true});

  deepEqual(fox.get('contact'), {email: 'foxxy@example.com', phone: '555-555-4545'});
});

test('Set triggers change events', function() {
  var fox, results = [];
  Crafty.c('Animal', {
    defaults: {
      name: 'Fox',
      contact: {
        email: 'fox@example.com',
        phone: '555-555-4545'
      }
    }
  });

  fox = Crafty.e('Animal, Model');

  fox.bind('DataChange', function() {
    results.push('DataChange');
  });
  fox.bind('DataChange[name]', function() {
    results.push('DataChange[name]');
  });
  fox.bind('DataChange[contact.email]', function() {
    results.push('DataChange[contact.email]');
  });

  fox.set({name: 'Lucky'});
  fox.set({contact: {email: 'foxxy@example.com'}}, {recursive: true});

  deepEqual(results, [
    'DataChange[name]',
    'DataChange',
    'DataChange[contact.email]',
    'DataChange'
  ]);

});

test('Dirty', function() {
  var fox;
  Crafty.c('Animal', {
    defaults: {
      name: 'Fox',
      dob: 'March 21',
      age: 24
    }
  });

  fox = Crafty.e('Animal, Model');

  equal(fox.is_dirty(), false);
  equal(fox.is_dirty('name'), false);
  equal(fox.is_dirty('age'), false);

  fox.set('name', 'Lucky');
  fox.set('dob', 'March 22');

  equal(fox.is_dirty(), true);
  equal(fox.is_dirty('name'), true);
  equal(fox.is_dirty('age'), false);

  deepEqual(fox.changed, ['name', 'dob']);
});

test('Data', function() {
  var fox;
  Crafty.c('Animal', {
    defaults: {
      name: 'Fox',
      dob: 'March 21',
      age: 24
    }
  });

  fox = Crafty.e('Animal, Model');

  fox.data({name: 'Foxxy'});

  equal(fox.data('name'), 'Foxxy');
  equal(fox.data('age'), 24);
});
