_ = require 'underscore'

files = [
#    "core.js",
#    "intro.js",
#    "HashMap.js",
    "2D.js",
#    "collision.js",
#    "hitbox.js",
#    "DOM.js",
#    "fps.js",
#    "html.js",
#    "storage.js",
#    "extensions.js",
#    "device.js",
#    "sprite.js",
#    "canvas.js",
#    "controls.js",
#    "animate.js",
#    "animation.js",
#    "drawing.js",
#    "isometric.js",
#    "particles.js",
#    "sound.js",
#    "text.js",
#    "loader.js",
#    "math.js",
#    "time.js",
#    "outro.js"
]

dirIn  = 'src/'
dirOut = 'markdown/'
data   = []

fs = require 'fs'

class Parser
    constructor: (@name) ->



# parse js file
parseJS = (path) ->
    lines       = fs.readFileSync(dirIn + path).toString().split("\n")
    open        = false

    content     = []
    category    = []
    components  = []
    see         = []
    triggers    = []
    name        = ''
    code        = []

    # parse file by line
    for line in lines

        open    = true  if line.indexOf('/**@') != -1 && ! open

        if open

            clean = line.trim().replace(/\/\*\*\@|\*\/|\*/, '')
            clean = clean.substr(1) if clean[0] = ' '

            if clean.trim() == ''
                # exclude empty string
            else if clean.indexOf('@category') != -1
                category.push clean[clean.indexOf('@category') + 9..].trim()
            else if clean.indexOf('@comp') != -1
                components.push clean[clean.indexOf('@comp') + 5..].trim()
            else if clean.indexOf('@see') != -1
                see.push clean[clean.indexOf('@see') + 4..].trim()
            else if clean.indexOf('@trigger') != -1
                event = clean[clean.indexOf('@trigger') + 8 ..]
                triggers.push clean[clean.indexOf('@trigger') + 8 ..].trim()

            else if /\#[^\#]/.test(clean)
                name = clean[clean.indexOf('#')+1..].trim()
            else if clean.indexOf('@sign') != -1
                code.push ''
                code.push clean[clean.indexOf('@sign') + 5..].trim()
            else if clean.indexOf('@param') != -1
                code.push clean[clean.indexOf('@param') + 6..].trim()
            else if clean.indexOf('@example') != -1

            else
                content.push clean

        # close
        if line.indexOf('*/') != -1 && open
            open    = false
            item = name: name, comp: components, cat: category, see: see, trig: triggers, cont: content, code: code
            data.push item

            console.log '===================================='
            console.log item

            components  = []
            category    = []
            content     = []
            see         = []
            triggers    = []
            code        = []
            name        = ''

    content

# Generate index
generateToc = (data) ->
    toc = {}

    for item in data
        toc[item.cat] = {} if toc[item.cat] == undefined
        toc[item.cat][item.comp] = [] if toc[item.cat][item.comp] == undefined

        if item.name == item.comp
            toc[item.cat][item.comp].shift item
        else
            toc[item.cat][item.comp].push item

    toc

# Save markdown file
saveMd = (data) ->

    if data.length

        toc = generateToc data

        # save files
        for own category, components of toc
            for own component, contents of components

                markdown = ''

                for content in contents

                    markdown += '\n\n##' + content.name + '\n\n'
                    markdown += content.code.join('\n') + '\n' if content.code.length
                    markdown += content.cont.join('\n') + '\n' if content.cont.length
                    markdown += '\n\n####Events\n\n> ' + content.trig.join('  \n') + '\n\n' if content.trig.length

                    fs.writeFile(dirOut + component + '.md', markdown, (err) ->
                        console.error err if err
                    )

# The main loop through the files
for file in files
    parseJS file

# Save the data to files
saveMd data
