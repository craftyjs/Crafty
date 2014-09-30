console.log('Saving a string:');
Crafty.storage('string', 'a');
console.log(Crafty.storage('string'));

console.log('Saving a JSON string:');
Crafty.storage('json', '{"s" : "string", "a":"4","b":"8.4", "c": { "ca" : "4", "cb" : "8.4", "cc" : { "a" : "4", "b" : "8.4" } }}');
console.log(Crafty.storage('json'));

Crafty.storage.remove('string');
Crafty.storage.remove('json');