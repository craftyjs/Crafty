# Import markdown parser
marked = require("marked");
marked.setOptions({breaks:false, sanitize:false})
#Import file system
fs = require 'fs'


docCallback = null
pendingOperations = 0
dirOut = 'markdown/'
templateName = "doc_template.html"
data   = []
versionString = "0.0.X"

writeOut = (name, html)->
    fs.writeFile(dirOut + cleanName(name) + '.html', html, (err) ->
            console.error err if err
            tracker();
    )

# Data structure that holds a ToC like structure
Table = {
    cats: [],
    comps: [],
    blocks: [],
}


# Adds a block to the index
processBlock = (block)->
    Table.blocks[block.name] = block;
    # Having a category tag means it's a component
    if block.categories.length>0
        for c in block.categories
            if not Table.cats[c]?
                Table.cats[c] = [];
            Table.cats[c].push( block )
        if not Table.comps[block.comp]
            Table.comps[block.name] =  {name:block.name, parts:[]}
        Table.comps[block.name].block = block

    # Having a component tag means it's part of a component page
    if block.comp
        if not Table.comps[block.comp]
            Table.comps[block.comp] =  {name:block.comp, parts:[]}
        Table.comps[block.comp].parts.push(block)

class DocBlock
    constructor: () ->
        @content = []
        @categories = []
        @comp = null
        @see = []
        @triggers = []
        @name = ""
        @code = []
        @prevTag = null

    processLine: (line) =>
        clean = line.trim().replace(/\/\*\*\@|\*\/|\*/, '')
        clean = clean.substr(1) if clean[0] is ' '
        tagged = clean.match(/\@([^\s]*)\s?(.*)/)

        if tagged?
            tag = tagged[1]
            value = tagged[2]?.trim()
            @processTag(tag, value)
        else if /^\s*\#[^\#]/.test(clean)
            @name = clean[clean.indexOf('#')+1..].trim()
        else
            if @isFunctionTag(@prevTag)
                @code.push("</dl>")
            @prevTag = null
            @code.push(clean)

    processTag: (tag, value) =>
        if @isFunctionTag(@prevTag) and not @isFunctionTag(tag)
            @code.push("</dl>")
        switch tag
            when "category"
                cats = value.split(/\s*,\s*/)
                for c in cats
                    @categories.push(c)
            when "comp"
                @comp = value;
            when "see"
                xrefs = value.split(/\s*,\s*/)
                for see in xrefs
                    @see.push({
                        name: see
                        link: if see.charAt(0) is "." then "##{cleanName(see)}"  else "#{cleanName(see)}.html"
                    })
            when "trigger"
                @event = value
                split = value.split(/\s+-\s+/)
                @triggers.push({
                    event: split[0]
                    description: split[1]
                    objName: split[3] or "Data"
                    objProp:  split[2] or null
                })
            when "sign"
                @code.push("`#{value}` \n")
            when "param"
                if not @isFunctionTag(@prevTag)
                    @code.push("<dl>")
                split = value.match(/(.+)\s+-\s+(.+)/)
                if split?
                    @code.push("<dt>#{split[1]}</dt><dd>#{split[2]}</dd>")
            when "return", "returns"
                if not @isFunctionTag(@prevTag)
                    @code.push("<dl>")
                @code.push("<dt class='return'>[returns]</dt><dd>#{value}</dd>")
            when "example"
                @code.push("<h4> Example </h4>\n")
            else
                @code.push(value)
        @prevTag = tag

    isFunctionTag: (tagname)->
        if tagname is "return" or tagname is "returns" or tagname is "param"
            return true
        else
            return false

    # Method for returning the documentation for this block
    getContent: ()->
        if @isFunctionTag(@prevTag) then @code.push("</dl>")
        return marked(@code.join("\n")) + triggerBlock(@triggers) + seeBlock(@see)

# parse js file
parseJS = (path) ->
    lines       = fs.readFileSync(path).toString().split("\n")
    open        = false

    # parse file by line
    for line, ln in lines
        # open
        if line.indexOf('/**@') != -1 && not open
            block = new DocBlock()
            block.file = path
            block.line = ln
            open    = true
        # process
        if open
            block.processLine(line)
        # close
        if line.indexOf('*/') != -1 && open
            open    = false
            processBlock(block)
            if block.name.length is 0
                console.log("No name for block at #{block.file}:#{block.line+1}")
            if block.categories.length is 0 and block.comp is null
                console.log("No component or category for block at #{block.file}:#{block.line+1} (#{block.name})")
            data.push block


cleanName = (name) -> name.replace(".", "-")

triggerBlock = (triggers, noheader)->
    return '' if triggers?.length is 0
    if noheader then block = "<dl>" else block = "\n<h4>Events</h4>\n<dl>"
    for t in triggers
        if t.objProp?
            block+=  "<dt><span class='event-name'>#{t.event}</span> [<span class='event-property-name'>#{t.objName}</span>: <span class='event-property'>#{t.objProp}</span>]</dt><dd>#{t.description}</dd>\n"
        else
            block+=  "<dt><span class='event-name'>#{t.event}</span></dt><dd>#{t.description}</dd>\n"
    block+="</dl>"
    return block

# Passed an *array* of cleaned up objects
seeBlock = (refs)->
    return '' if refs?.length is 0
    block = "\n<h4>See Also</h4>\n<ul>"
    for r in refs
        block+= "<li><a href=#{r.link}>#{r.name}</a></li>"
    block+= "</ul>"
    return block

createPage = (page)->
    description = "##{page.name}\n"
    description += "\n" + page.block?.getContent()

    if page.block.triggers?.length>0
        eventContent = "##{page.name}\n" + triggerBlock(page.block.triggers, true)

    partContent = ""
    if page.parts.length
        partList = "<div class='doc-contents'><h4>Properties and Methods</h4><ul>"
        for part in page.parts
            clName = cleanName(part.name)
            partList += """<li><a href='##{clName}'>#{part.name}</a></li>"""
            partContent += "\n\n<div id='#{clName}' class='docblock'>\n\n<a href='#doc-nav' class='doc-top'>Back to top</a><h2>#{part.name}</h2>\n" +  marked(part.getContent()) + "\n\n</div>\n\n"
            if part.triggers.length > 0
                eventContent = "\n<h2>#{page.name}</h2>\n<hr/>\n" if not eventContent
                eventContent += "\n<h3>#{part.name}</h3>\n" + triggerBlock(part.triggers, true)
        partList += "</ul></div>"
    else
        partList = ""
    pageContent = description + partList + partContent
    #if page.name is "2D"
    #    console.log(pageContent)
    return [pageContent, eventContent]

# Save markdown file
saveMd = (data) ->
    template = fs.readFileSync(templateName).toString().replace("VERSION_STRING", versionString)
    #console.log(template)
    nav_html = "<ul id='doc-level-one'><li><a href='events.html'>List of Events</a></li>"
    events_html = ""
    pages = [];

    # Compile the navigation and the content chunks
    for catName, cat of Table.cats
        nav_html += "<li>#{catName}<ul>"
        triggerListed = false
        for page in cat
            # Add nav entry
            nav_html+="<li><a href='#{cleanName(page.name)}.html'>#{page.name}</a></li>"

            # Pages can be listed multiple times in the nav, but we should only generate them once
            continue if page.flagged is true
            page.flagged = true

            # Make page
            comp=Table.comps[page.name]
            [markdown, eventContent] = createPage(comp)
            events_html += marked(eventContent) if eventContent
            html = marked(markdown)
            pages.push( {name: page.name, content_html: html})

        nav_html += "</ul></li>"
    nav_html += "</ul>"

    # We need to keep track of how many pending operations there are
    pendingOperations = pages.length + 2

    # Write out events and index file
    html = template.replace("CONTENT_DIV", events_html).replace("NAV_DIV", nav_html)
    writeOut("events", html)
    #console.log(html)
    html = template.replace("CONTENT_DIV", "").replace("NAV_DIV", nav_html)
    writeOut("index", html)

    # Go through and actually generate and write the html pages
    for page in pages
        html = template.replace("CONTENT_DIV", page.content_html).replace("NAV_DIV", nav_html)
        writeOut(page.name, html)

    return



tracker = ()->
    pendingOperations--
    if pendingOperations<=0
        docCallback()



# Iterates through `files`, creating documentation in the `output` directory.
document = (files, output, template, version, callback)->
    docCallback = callback
    console.log("Parsing source files")
    # The main loop through the files
    templateName = template
    dirOut = output
    versionString = version
    for file in files
        parseJS file

    # Save the data to files
    saveMd data

exports.document = document
