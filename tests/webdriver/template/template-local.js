QUnit.module(module);

QUnit.test("Local webdriver test template", function(assert) {
  return browser
    .url('tests/webdriver/template-local.html')
    .assertResemble(10.00);
});
