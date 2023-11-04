let re = /[\.-]/g
let omitRe = /[\(\)]/g

module.exports = function cleanName(raw) {
  return raw.replace(re, "-").replace(omitRe, "");
}
