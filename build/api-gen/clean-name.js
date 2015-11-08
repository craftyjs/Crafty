var re = /[\.-]/g

module.exports = function cleanName(raw) {
  return raw.replace(re, "-");
}
