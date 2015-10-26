#Import file system
fs = require 'fs'
gitrev = require('git-rev-sync').long()

class LineBuffer 
    ln: 0
    constructor: (path)->
        @lines = fs.readFileSync(path).toString().split("\n")
        @file = path

    current: ()-> 
        if @isOpen() then @lines[@ln] else null
    next: ()-> 
        @ln++
        return @current()
    isOpen: ()-> @ln < @lines.length - 1


# parse js file
parseSource = (path) ->
    buffer = new LineBuffer(path)
    blocks = []    
    while buffer.isOpen()
        block = nextBlock buffer
        blocks.push(block) if block?

    return blocks

# Run through the buffer until we find a block, then process that block and return it
# Return early if we run out of file!
nextBlock = (buffer) ->
    # Scan for next block
    while buffer.isOpen() and buffer.current().indexOf('/**@') == -1
        buffer.next() 

    return if not buffer.isOpen()
    
    startLine = buffer.ln + 1
    file = buffer.file

    # Skip the opening tag
    buffer.next()
    
    # Process block, stopping when the doclet finishes, and returning an array of the results
    nodes = while buffer.isOpen() and buffer.current().indexOf('*/') == -1
        n = nextNode( buffer )
        continue if not n?
        parseNode(n.tag, n.value)


    endLine = buffer.ln + 1
    return {
        nodes: nodes
        line: startLine
        endLine: endLine
        commit: gitrev
        file: file
    }


# Regexes for nextNode
tagRe = /\@([^\s]*)\s?(.*)/
nameRe = /^\s*\#[^\#]/
emptyRe = /^\s*$/

# Check whether a tag should be greedy or lazy when consuming subsequent lines
lazyTag = (tag) ->
    switch tag 
        when "name", "comp", "category", "example", "sign"
            true
        else
            false

# Assign each line to a node, throwing away empty lines that aren't directly after untagged lines
# Guaranteed to leave the buffer in a state where buffer.current() hasn't yet been processed
nextNode = (buffer)->

    
    # Find next non-empty line
    while (buffer.isOpen() and buffer.current().indexOf('*/') == -1) and (clean = cleanLine( buffer.current() )).length == 0
        buffer.next()
    return null if buffer.current().indexOf('*/') >= 0 or not buffer.isOpen()
    buffer.next()

    return null if clean.length == 0 

    # Determine what type of tag we're looking at
    tagged = clean?.match(tagRe)
    if tagged?
        node = {
            tag: tagged[1],
            value: tagged[2]?.trim()
        }
    else if nameRe.test(clean) 
        node = {
            tag: "name",
            value: clean[clean.indexOf('#')+1..].trim()
        }
    else
        value = clean
        node = {tag: "raw", value: value}
    return node if lazyTag(node.tag)

    # Now consume non-tagged lines until we hit an empty line or a tag
    while (
            (buffer.isOpen() and buffer.current().indexOf('*/') == -1) and 
            ( (clean = cleanLine(buffer.current()) ).length > 0 or node.tag is "raw") and 
            (not tagRe.test(clean) and not nameRe.test(clean))
    )

        if (node.tag is "raw")
            node.value += "\n" + clean
        else
            node.value += " " + clean

        buffer.next()
        break if not buffer.isOpen()
    return node

cleanLine = (line)->
    # Trim the line, then remove the comment markers
    clean = line.trim().replace(/\/\*\*\@|\*\/|\*/, '')
    # Remove just the first space of the new line (additional spaces will be intentional formatting)
    clean = clean.substr(1) if clean[0] is ' '
    # Check if the remaining string contains any non-space characters, emptying if not
    # Replace it with the empty string if not
    if ( !(/\S/.test(clean)) )
        clean = "";
    # Triple backtick is a bit more standard for markdown parsers
    clean = clean.replace("~~~", "```")
    return clean or ""

cleanName = (name) -> name.replace(".", "-")


# Alternate names for some tags
aliases = {
    "returns": "return"
    "triggers": "trigger"
}

# If a node needs extra logic to be parsed, that's kept here
# By default, it just gets processed to a type and a value
nodeParsers = 
    trigger: (value)->
        split = value.split(/\s+-\s+/)
        {
            type: "trigger"
            event: split[0]
            description: split[1]
            objName: split[3] or "Data"
            objProp:  split[2] or null
        }
        
    see: (value)->
        type: "xref"
        xrefs: value.split(/\s*,\s*/)
    param: (value)-> 
        split = value.match(/(.+)\s+-\s+(.+)/)
        if split?
            return {
                type: "param"
                name: split[1]
                description: split[2]
            }
        else
            return {
                type: "param"
                name: value
                description: ""
            }
    category: (value)-> 
        type: "category"
        categories: value.split(/\s*,\s*/)
    example: ()->
        type: "example"


# Parse the node, calling any defined parser as necessary
parseNode = (tag, value)->
    tag = aliases[tag] or tag
    if (nodeParsers[tag]?)
        return nodeParsers[tag](value)
    else
        return {
            type: tag
            value: value
        }



# The top level method: given a list of files, parses each file into an array of docblocks, which are themeselves arrays of nodes
# Returns one array of all the docblocks parsed
parse = (files)->
    blocks = []
    for file in files
        newBlocks = parseSource file
        blocks = blocks.concat(newBlocks)

    return blocks


exports.parse = parse
