(function() {
  var module = QUnit.module;

  module("Model");

  test('Set triggers change events', function() {
    var fox, results = [];
    Crafty.c('Animal', {
      name: 'Fox',
      contact: {
        email: 'fox@example.com',
        phone: '555-555-4545'
      }
    });

    fox = Crafty.e('Animal, Model');

    fox.bind('Change', function() {
      results.push('Change');
    });
    fox.bind('Change[name]', function() {
      results.push('Change[name]');
    });
    fox.bind('Change[contact.email]', function() {
      results.push('Change[contact.email]');
    });

    fox.attr({name: 'Lucky'});
    fox.attr({contact: {email: 'foxxy@example.com'}}, false, true);

    deepEqual(results, [
      'Change[name]',
      'Change',
      'Change[contact.email]',
      'Change'
    ]);

  });

  test('Dirty', function() {
    var fox;
    Crafty.c('Animal', {
      name: 'Fox',
      dob: 'March 21',
      age: 24
    });

    fox = Crafty.e('Animal, Model');

    equal(fox.is_dirty(), false);
    equal(fox.is_dirty('name'), false);
    equal(fox.is_dirty('age'), false);

    fox.attr('name', 'Lucky');
    fox.attr('dob', 'March 22');

    equal(fox.is_dirty(), true);
    equal(fox.is_dirty('name'), true);
    equal(fox.is_dirty('age'), false);

    deepEqual(fox.changed, ['name', 'dob']);
  });
})();
