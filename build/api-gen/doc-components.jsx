var marked = require("marked");
var hljs = require("highlight.js");
var cleanName = require("./clean-name");
var githubRoot = "https://github.com/craftyjs/Crafty/blob/";


// Assumes the marked.js renderer has been imported into a global variable `marked`
var MarkdownBlock = React.createClass({
  markedConfig: {
      renderer: (function() {
          var r = new marked.Renderer();
          r.code = function(code, language){
            return '<pre><code class="hljs ' + (language || "") + '">' + 
                hljs.highlight("javascript", code).value +
              '</code></pre>';
          };
          return r;
      })()
  },

  convert: function(raw) {
    var raw = marked(raw, this.markedConfig)
    return raw;
  },
  
  render: function() {
    var raw = this.props.value;
    var rawHtml = this.convert(raw);
    var key = this.props.key;
    return <span key={key} className="markdown" dangerouslySetInnerHTML={{__html: rawHtml}} />
  }
})


var ToC = React.createClass({
  render: function() {
    var blocks = this.props.data;
    var toc = this.props.index;
    var primary = this.props.primary;

    // Generate categories
    catArray = [];
    for (var cat in toc.categories) {
      if (cat != primary) {
        catArray.push(toc.categories[cat]);
      }
    }
    catArray.sort(nameSort);
    var catElements = catArray.map( function(cat, index){return <Category key={cat.name} catName = {cat.name} pages = {cat.pages}/>});
    return (
      <ul id = "doc-level-one">
        <li><a href="events.html">List of Events</a></li>
        <Category catName = {primary} pages = {toc.categories[primary].pages}/>
        {catElements}
      </ul>
    )
  }

})

var DocLink = React.createClass({
  render: function() {
    var target = this.props.target;
    var linkText, href;
    var parent = (this.props.parentPage) ? this.props.parentPage.main.name : undefined;
    // If the link target starts with the name of the page, assume it is an internal link
    // (This is about resolving links such as Crafty.viewport.centerOn)
    // If the ref begins with # or ., also assume it is an internal link
    if (parent && target.indexOf(parent + ".") === 0 ) {
      linkText = target.replace(parent, "");
      href = "#" + cleanName(target);
    } else if (target[0] === "#") {
      linkText = target.substr(1);
      href = cleanName(target);
    } else if (target[0] === ".") {
      linkText = target;
      href = "#" + cleanName(target);
    } else if (target.indexOf("#") > 0){
      var i = target.indexOf("#");
      var page = target.substring(0, i);
      var anchor = target.substring(i+1);

      // Handle link text based on context
      if (anchor.indexOf(page) >= 0) {
        linkText = anchor;
      } else if (anchor[0] === ".") {
        linkText = page + anchor;
      } else {
        linkText = page + "\u2794" + anchor;
      }

      href = cleanName(page) + ".html#" + cleanName(anchor);
    } else {
      linkText = target;
      href = cleanName(target) + ".html";
    }
    return <a href={href}>{linkText}</a>
  }
})

var Category = React.createClass({
  render: function() {
    this.props.pages.sort(stringSort);
    var pages = this.props.pages.map(function(page, index){return <li key={page}><DocLink target={page}/></li>});
    return ( 
      <li className="category">
        {this.props.catName}
        <ul className="category-list">
          {pages}
        </ul>
      </li>
    )
  }
});

var Node = React.createClass({
  render: function() {
    var node = this.props.node;
    var page = this.props.page;
    switch(node.type) {
      case "method":
        return <Method data={node} page={page}/>
      case "param":
        return <Parameter paramName={node.name} page={page} paramDescription={node.description} />
      case "triggers":
        return <Events triggers={node.events} page={page}/>
      case "raw":
        return <MarkdownBlock value={node.value} page={page}/>
      case "return":
        return <Returns value={node.value} page={page}/>
      case "xref":
        return <SeeAlso xrefs = {node.xrefs} page={page} />
      case "example":
        return <Example contents={node.contents} page={page} />
      case "warning":
        return <Warning page={page} warning ={node.value} />
      case "note":
        return <Note page={page} note={node.value} />
      default:
        return <p> Unsupported node type: <b style={{color:"red"}}>{node.type}</b></p>
    }
  }
})

function mapNodes(contents, page){
  return contents.map( function(node, index){ 
    return <Node key={index} node={node} page={page}/>
  });
}


var SubSectionHeader = React.createClass({
  render: function() {
    return <h4>{this.props.children || ""}</h4>
  }
})

// SeeAlso
var SeeAlso = React.createClass({
  render: function() {
    var page = this.props.page;
    xrefs = this.props.xrefs.map(function(xref, index){
      // if ()
      return <li key={xref}><DocLink parentPage={page} target={xref} /></li>
    });
    return <div>
      <SubSectionHeader>See Also</SubSectionHeader>
      <ul className="see-also-list">
        {xrefs}
      </ul>

    </div>
  }
})

// Example

var Example = React.createClass({
  render: function() {
    var contents = this.props.contents;
    var pieces = mapNodes(contents, this.props.page);
    return (<div className = "example">
      <SubSectionHeader>Example</SubSectionHeader>
      {pieces}
    </div>)

  }
})

// Warning

var Warning = React.createClass({
  render: function() {
    return <div className = "warning">
      <div className = "warning-prefix">Warning</div> 
      <MarkdownBlock value={this.props.warning} page={this.props.page} /> 
    </div>
  }
});

// Note

var Note = React.createClass({
  render: function() {
    return <div className = "note">
      <MarkdownBlock value={"**Note:** " + this.props.note} page={this.props.page}/> 
    </div>
  }
});

// Event & Trigger

var Events = React.createClass({
  render: function() {
    if (!this.props.triggers)
      return <div/>
    triggers = this.props.triggers.map(function(trigger, index){
      return <Trigger key={index} trigger = {trigger}/>
    })
    if (this.props.noHeading)
      var heading = "";
    else
      var heading = <SubSectionHeader>Events</SubSectionHeader>;
    return (
      <div className="triggered-events">
        {heading}
        <div className = "trigger-list">
          {triggers}
        </div>
      </div>
    );
  }
})

var Trigger = React.createClass({
  render: function() {
    var trigger = this.props.trigger;
    var triggerData;
    if (trigger.objName !== "Data" || trigger.objProp) {
      if (trigger.objProp) {
        var props = trigger.objProp;
        if (props[0] !== "{")
          props = "{" + props + "}";
        props = " = " + props;
      } else {
        var props = "";
      }
      triggerData = <span>
        [<span className="trigger-data">
          <span className="obj-name">{trigger.objName}</span> 
          <span className = "obj-props">{props}</span>
        </span>]
      </span>
    } else {
      triggerData = "";
    }
    return (
      <dl className="trigger">
          <dt>{trigger.event} {triggerData}</dt>
          <dd>{trigger.description}</dd>
      </dl>
    )

  }
})


// Objects for displaying methods: Method is the container, Signature is required, Parameter and Returns are optional

var Method = React.createClass({
  render: function() {
    var contents = this.props.data.contents;
    var pieces = mapNodes(contents, this.props.page);
    return (
      <div className="crafty-method">
        <Signature  sign = {this.props.data.signature} />
        {pieces}
      </div>
    )
  }
});

var Parameter = React.createClass({
  render: function() {
    return (
      <dl className = "parameter">
        <dt> {this.props.paramName} </dt>
        <dd><MarkdownBlock value={this.props.paramDescription} key={1} /></dd>
      </dl>
    )
  }
})

// Seperator reg ex
var sepRe = /([()[\],]+)/ ;
var Signature = React.createClass({
  render: function() {

    var parts = this.props.sign.split(sepRe);
    var contents = parts.map(function(content, index) {
      if (sepRe.test(content)) {
        return <SignatureSeperator key = {index} value = {content} />
      } else if (content.length === 0) {
        return "";
      } else {
        return <SignaturePhrase key = {index} value = {content} />
      }
    })
    return (
        <code className="signature">
          {contents}
        </code>
    );
  }
});

var SignaturePhrase = React.createClass({
  render: function() {
    var phrase = this.props.value.split(" ");
    var last = phrase.length - 1;
    var words = phrase.map( function(word, index) {
        if (index === last) {
          return <span key = {index} className="sig-noun">{word}</span>
        } else {
          return <span key = {index} className = "sig-qualifier">{word} </span>
        }
    });
    return (
      <span className = "sig-phrase">
        {words}
      </span>
    );
  }
})

var SignatureSeperator = React.createClass({
  render: function() {
    return <span className = "sig-seperator">{this.props.value}</span>
  }
})

var Returns = React.createClass({
  render: function() {
       return (
      <dl className = "parameter returns"> 
        <dt className="returns"> [Returns] </dt> 
        <dd><MarkdownBlock value={this.props.value} key={2} /></dd> 
      </dl>
    )
  }
})


// Base doclet component

var Doclet = React.createClass({
  render: function() {
    var contents = this.props.data.contents;
    var pieces =  mapNodes(contents, this.props.page);
    if (!this.props.top) {
      var link = <a href='#doc-nav' className='doc-top'>Back to top</a>
      var header = <h2 className="doclet-header">{this.props.data.name}</h2>
    } else {
      var link = "";
      var header = "";
    }
    return (
      <div className="doclet" id={cleanName(this.props.data.name)}>
        {link}
        {header}
        <div className="doc-source"><SourceLink data={this.props.data}/></div>
        {pieces}
      </div>
    )
  }
});

var SourceLink = React.createClass({
  render: function() {
    var file = this.props.data.file;
    var start = this.props.data.startLine;
    var end = this.props.data.endLine;
    var commit = this.props.data.commit;
    var fileLocation = file +"#L" + start + "-" + end;
    var target = githubRoot + commit + "/" + fileLocation;
    return <a href={target}>{fileLocation}</a>
  }

})



function nameSort(a, b) {
    return stringSort(a.name, b.name);
}

function stringSort(a, b) {
    if (typeof a === "string" && typeof b==="string")
      return a.toUpperCase().localeCompare(b.toUpperCase());
    else
      if (typeof b === "string")
        return 1;
      else
        return -1;
}


// page, dict, 
var DocPage = React.createClass({
  render: function() {
    var page = this.props.page;
    if (!page) {
      return <div/>
    }
    var parts = page.parts;
    parts.sort(nameSort);
    var partlets = parts.map(function(part, index){return <Doclet key={index} data={part} top={false} page={page}/>});
    var page_toc = parts.map( function(part, index){ return <li key={index}><InternalLink parent={page.main.name} target={part.name} value={part.name}/></li>});
    if (!page.main){
      return <div/>
    }
    if (parts.length > 0) {
      var bottomParts = 
        <div>
          <SubSectionHeader>Methods and Properties</SubSectionHeader>
          <ul className = "page-toc">
            {page_toc}
          </ul>
          {partlets}
        </div>
    } else {
      var bottomParts = "";
    }
    return (
      <div className="doc-page">
        <h1>{page.main.name}</h1>
        <Doclet data={page.main} page={page} top={true}/>
        {bottomParts}
      </div>
    )
  }
})

var EventPage = React.createClass({
  render: function() {
    var parts = this.props.data;
    var events = [];
    var index=0;
    for (var p in parts) {
      var part = parts[p];
      var contents = part.contents;
      for (var b in contents){
        var block = contents[b];
        if (block.type == "triggers") {
          events.push( 
            <div key={index++} className="eventPageBlock">
              <SubSectionHeader>{part.name}</SubSectionHeader>
              <Events  triggers={block.events} noHeading={true}/>
            </div>

          );
        }
      }
    }
    var retval =  <div className="events-page">
      {events}
    </div>
    return retval;
  }
})


var InternalLink = React.createClass({
    render: function() {
      var cleanTarget = cleanName(this.props.target);
      var linkText = this.props.target.replace(this.props.parent, "");
      return <a href={"#" + cleanTarget}>{linkText}</a>
    }
});



if (module) {
  module.exports = {
    "DocPage":DocPage,
    "ToC": ToC,
    "EventPage": EventPage
  }
}
