var http = require('http'),
    director = require('director');


var React = require('react');
require('node-jsx').install({extension: '.jsx'});
var StaticPage = require('./server-side'); // React component

var createIndex = require("./index-docs");
var cleanName = require("./clean-name");

function startServer(grunt, input){
    var api = grunt.file.readJSON(input),
      index = createIndex(api),
      pages = index.pages,
      props = {data: api, index: index};

    function createPage(selector, filename) {
      filename = filename || cleanName(selector) + ".html";
      props.selector = selector;
      var page = React.createElement(StaticPage, props);
      var raw = React.renderToStaticMarkup(page);
      if (pages[selector]) {
        var title = pages[selector].main.name;
      } else {
        var title = selector || filename;
      }
      raw = "<head><title>" + title + "</title><link type='text/css' rel='stylesheet' href='http://craftyjs.com/craftyjs-site.css'/><link type='text/css' rel='stylesheet' href='http://craftyjs.com/github.css'/></head>"
          + "<body><div id='main'><div id='content' class='container'>" + raw +  "</div></div></body>";

      return raw;
    }

    var router = new director.http.Router();

    var server = http.createServer(function (req, res) {
      router.dispatch(req, res, function (err) {
        if (err) {
          // Return index when page is missing
          this.res.writeHead(200, { 'Content-Type': 'text/html' })
          this.res.end( createPage("index") );
        }
      });
    });

    router.path(/(.+)\.html/, function () {
      this.get(function (id) {
        this.res.writeHead(200, { 'Content-Type': 'text/html' })
        this.res.end( createPage(id) );
      });
    });

    console.log("Starting api server")
    server.listen(8080);
};

module.exports = startServer;