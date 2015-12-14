QUnit.module(require('path').basename(module.filename, '.js'));

QUnit.test("Local webdriver test template", function(assert) {
  return browser
    .url('/tests/webdriver/template-local.html')
    .assertResemble(10.00);
});
