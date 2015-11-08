fs = require 'fs'

class nodeIterator
	i: 0
	constructor: (nodes) ->
		@nodes = nodes
	current: ()-> if @i < @nodes.length then @nodes[@i] else null
	next: ()-> 
		@i++
		return @current()
	hasNext: ()-> @i < @nodes.length - 1


exports.structureBlocks = (blocks) ->
	structuredJson = for block in blocks
		if block?
			try
				structureBlock(block)
			catch e
				console.log("Error!\n\n", e)
				console.log(block)

	return structuredJson

structureBlock = (block)->

	iterator = new nodeIterator(block.nodes)
	block = {
		file: block.file
		startLine: block.line
		endLine: block.endLine
		commit: block.commit
		contents:[]
	}
	while ( iterator.current() )
		nextNode(block, iterator)
	return block

nextNode = (parent, iterator)->
	t = iterator.current().type
	try
		addNode[iterator.current().type](parent, iterator)
	catch e
		console.log("Problem adding node ", t)
		console.log(e)
		iterator.next();

# All these functions are guaranteed to leave the iterator in a state where current() hasn't yet been added to anything
addNode = 
	raw: (parent, iterator)->
		parent.contents.push(iterator.current())
		iterator.next()

	note: (parent, iterator)->
		parent.contents.push(iterator.current())
		iterator.next()

	warning: (parent, iterator)->
		parent.contents.push(iterator.current())
		iterator.next()

	xref: (parent, iterator)->
		base = iterator.current()
		while (iterator.next()?.type is "xref")
			base.xrefs = base.xrefs.concat( iterator.current().xrefs) 
		parent.contents.push( base )

	trigger: (parent, iterator)->
		base = {
			type: "triggers",
			events: [ iterator.current() ]
		}
		while (iterator.next()?.type is "trigger")
			base.events.push( iterator.current() )
		parent.contents.push( base )

	example: (parent, iterator)->
		base = {
			type: "example",
			contents: []
		}
		iterator.next()
		while (iterator.current()?.type is "raw")
			nextNode(base, iterator)
		parent.contents.push(base)

	# Because the description of the method isn't directly delineated, this is a bit hairy to parse
	sign: (parent, iterator)->
		base = {
			type: "method"
			signature: iterator.current().value
			contents: []
		}
		current = iterator.next()
		while (current)
			switch iterator.current().type
				when "raw" 
					rawNode = iterator.current()
					next = iterator.next()
					# Test to see if the raw test node should be considered part of this block or not!
					if next?.type is "param" or next?.type is "return"
						base.contents.push(rawNode)
						current = next
					else
						parent.contents.push(base)
						parent.contents.push(rawNode)
						return
				when "param", "return"
					nextNode(base, iterator)
					current = iterator.current()
				else 
					current = null

		parent.contents.push(base)

	param: (parent, iterator)->
		parent.contents.push(iterator.current())
		iterator.next()

	return: (parent, iterator)->
		parent.contents.push(iterator.current())
		iterator.next()

	comp: (parent, iterator)->
		parent.comp = iterator.current().value
		iterator.next()

	category: (parent, iterator)->
		parent.categories = iterator.current().categories
		iterator.next()

	name: (parent, iterator)->
		parent.name = iterator.current().value
		iterator.next()
	requires: (parent, iterator)->
		parent.requires = iterator.current().value
		iterator.next()

	#These are used only in 2d math files, and so don't have much meaning!
	public: (parent, iterator)->
		parent.public = true;
		iterator.next()
	class: (parent, iterator)->
		parent.class = iterator.current().value
		iterator.next()
	static: (parent, iterator)->
		iterator.next()



