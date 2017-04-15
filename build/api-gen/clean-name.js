var re = /[\.-]/g
var omitRe = /[\(\)]/g

module.exports = function cleanName(raw) {
  return raw.replace(re, "-").replace(omitRe, "");
}
