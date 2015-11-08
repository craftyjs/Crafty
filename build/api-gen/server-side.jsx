React = require("react");

docComp = require("./doc-components");
var ToC = docComp.ToC;
var DocPage = docComp.DocPage;
var EventPage = docComp.EventPage;


// We create a StaticPage component for generating the page
// Unlike in thre dynamic case, we assume we can just pass the necessary state directly
var StaticPage = React.createClass({
	render: function() {
		var pages = this.props.index.pages;
		var selector = this.props.selector;
		var dict = this.props.index.dictionary;
		
		if (selector == "events") {
			var content =  <EventPage data = {this.props.data} />
		} else {
			var page = pages[selector];
			if (page) {
				var content = <DocPage page={page} dict={dict} />
			} else {
				var content = <div/>
			}
		}

		return <div id="docs">
			<div className="toc-holder" id = "doc-nav">
				<ToC data = {this.props.data} index = {this.props.index} primary = "Core"/>
			</div>
			<div id="doc-content" className="doc-page-holder">
				{content}
			</div>
		</div>
	}


})

var StaticFactory = React.createFactory(StaticPage);

module.exports = StaticPage;



