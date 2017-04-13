QUnit.module(module);

QUnit.test("Generic webdriver test template", function(assert) {
  return browser
    .url('http://info.cern.ch/hypertext/WWW/TheProject.html')
    .getTitle(function(err, title) {
      assert.strictEqual(title, "The World Wide Web project");
    });
});
