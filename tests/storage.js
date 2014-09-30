(function() {
  module("Storage");

  test('get a value', function(){
    Crafty.storage('name', 'test');
    var name = Crafty.storage('name');

    equal(name, 'test', 'the values should be equal');

    Crafty.storage.remove('name');
  });

  test('get null when a value does not exist', function(){
    var name = Crafty.storage('notexisting');
    equal(name, null, 'should be null');
  });
  
  test('saving string json object', function(){
    Crafty.storage('json', '{"a":"4","b":"8.4", "c": { "ca" : "4", "cb" : "8.4", "cc" : { "a" : "4", "b" : "8.4" } }}');
    var object = Crafty.storage('json');
    equal(object.a, 4, 'the values should be equal');
    Crafty.storage.remove('json');
  });

  test('remove an value', function(){
    var person = Crafty.storage('person', 'test');
    equal(Crafty.storage('person'), 'test', 'person should be defined');

    Crafty.storage.remove('person');

    var savedperson = Crafty.storage('person');
    equal(savedperson, null, 'should be null because we just removed the value');
  });
})();