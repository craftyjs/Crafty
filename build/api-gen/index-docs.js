var cleanName = require("./clean-name");

function createIndex(blocks) {
  var cats = {};
  var pages = {};
  var dictionary = {};
  function comp(c) {
    var clean = cleanName(c);
    return pages[clean] || (pages[clean] = {name:c, cleanName: clean, main: null, parts:[]})
  }
  function cat(c) {
    return cats[c] || (cats[c] = {name:c, pages:[]})
  }
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    // Add to any categories
    if (block.categories) {
      for (var j = 0; j < block.categories.length; j++) {
        if (block.name) {
          cat(block.categories[j]).pages.push(block.name)
        }
        comp(block.name).main = block;
      }
    }
    // Add to any comps
    if (block.comp && block.name) {
      comp(block.comp).parts.push(block);
    }

    if (block.name) {
      dictionary[block.name] = block;
    }
  }

  // console.log("Cats", cats)
  return {
    pages: pages,
    categories: cats,
    dictionary: dictionary
  }

}

module.exports = createIndex;