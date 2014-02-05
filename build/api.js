var fs = require('fs');

var docs = {};

function createDocs(files, callback) {
  finishLoading = after(files.length, function(){
    fs.writeFile('./build/docs.json', JSON.stringify(docs, false, '  '));
  });
  for(var i = 0; i < files.length; i++){
    var file = files[i];
    var filename = file.split('/')[1];
    // if(file.indexOf('loader') !== -1){
      readFile(file, filename, finishLoading);
    // }
  }
}

// Borrowed from underscore.js
// This function returns a function which only run after a certain number
function after(times, func) {
  return function(){
    if(--times < 1){
      return func.apply(this, arguments);
    }
  }
}
// Checks if a {} is empty
function isEmpty(obj) {
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
};

// Read the files async
function readFile(file, filename, callback) {
  fs.readFile(file, {encoding: 'Utf-8'}, function(err, data){
    var doc = parseFile(data);
    if(!isEmpty(doc)){
      docs[filename] = doc;
    }
    callback();
  });
}

function parseFile(data) {

  var lines = data.split('\n');
  // If i
  var blockComment = false;
  var blocks = [];
  var block = [];
  var example = false;
  for(var i = 0; i < lines.length; i++){
    var line = lines[i];
    if(line.indexOf('/**@') !== -1){
      blockComment = true;

    }
    if(blockComment){
      var result = parseLine(line);
      console.log(result);
      // If line not empty
      if(result){
        if(result.see){
          example = false;
        }
        // If the line is in the example block
        if(example){
          result = {example: result.doc};
        }
        // If the param Example is encountered, it is start of example block
        if(result.example === true){
          example = true;
          result.example = '';
        }
        block.push(result);
      }
    }
    if(line.indexOf('*/') !== -1){
      // console.log(block)
      var combined = combineObjects(block);
      if(!isEmpty(combined)){
        blocks.push(combined);
      }
      block = [];
      example = false;
      blockComment = false;
    }

  }

  return blocks;
}

function combineObjects(block) {
  var combined = {};
  for(var z = 0; z < block.length; z++){
    for(key in block[z]){
      console.log('COMBINE', key, block[z][key]);
      // console.log(key);
      if(!combined.hasOwnProperty(key)){
        combined[key] = block[z][key];
      } else {
        if(typeof combined[key] === "boolean" || typeof combined[key] === "string"){
          console.log(combined[key], typeof combined[key]);
          combined[key] = [combined[key]];
        }
        console.log('PUSH', block[z][key]);
        combined[key].push(block[z][key]);
      }
    }
  }
  return combined;
}

// Removes the asterisks that is in the comment
function cleanLine(line) {
  line = line.trim().replace(/\/\*\*\@|\*\/|\*/, '');

  if(line[0] == ' '){
    line = line.substr(1);
  } 
  return line;
}

// Parse the individual line
function parseLine(_line) {
  var line = cleanLine(_line);
  var result = null;
  if(line.indexOf('#') === 0){
    return {name: line.replace('#', '')};

  } else if (line.indexOf('@') === 0){
    // If it is a param then parse it
    result = parseParam(line);

  } else {
    if(line.trim().length > 0){
      result = {doc: line};
    }
  }

  return result;
}

function parseParam(line){
  line = line.split(' ')
  var param = line[0];
  line.splice(0, 1);
  var value = line.join(' ');
  switch(param){
    case '@category':
      // console.log('category', value)
      return {category: value};
      break;
    case '@comp':
      // console.log('comp', value);
      return {comp: value};
      break;
    case '@see':
      // console.log('see', value);
      return {see: value};
      break;
    case '@trigger':
      // console.log('trigger', value);
      return {trigger: value};
      break;
    case '@sign':
      // console.log('sign', value);
      return {sign: value};
      break;
    case '@param':
      // console.log('param', value);
      return {param: value};
      break;
    case '@return':
      // console.log('return', value);
      return {'return': value};
      break;
    case '@example':
      // console.log('return', value);
      return {example: true};
      break;
  }
}

module.exports = createDocs;