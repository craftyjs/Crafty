var inneroffset,
	blurred = false,
	selected = null,
	labels = {},
	file;

function spritify(f) {
	file = f;
	
	var controls_width = 150,
		width;
		
	$sprite.attr("src", file).load(function() {
		width = this.width;
		
		$spritify.dialog({
			modal: true,
			width: width + controls_width,
			height: 'auto',
			resizable: false,
			buttons: {
				'Save' : function() {
					
				},
				
				'Cancel': function() {
					$(this).dialog("close");
				}
			},
			dragStop: function() {
				inneroffset = $grid.offset();
			}
		});
		
		//init grid
		$grid.css({width: $(this).width(), height: $(this).height() });
		inneroffset = $grid.offset();
	}).error(function() {
		errorz("Image not found!", "We can't find the image <code>"+file+"</code>");
	});
	$grid.mousemove(overHandler).click(clickHandler);
	
	$tilesize.keydown(intOnly).keyup(gridHandler);
	$paddingx.keydown(intOnly).keyup(gridHandler);
	$paddingy.keydown(intOnly).keyup(gridHandler);
	$width.keydown(intOnly).keyup(gridHandler);
	$height.keydown(intOnly).keyup(gridHandler);
	
	$label.keypress(function() {
		if(!selected) {
			$(this).blur();
			return false;
		}
	}).keyup(function() {
		if(!selected) return false;
		
		labels[selected[0]+"x"+selected[1]+"x"+selected[2]+"x"+selected[3]] = $(this).val();
	});
}

function intOnly(e) {
	return (e.keyCode >= 48 && e.keyCode <= 57) || e.keyCode == 8 || e.keyCode == 46;
}

function clickHandler(e) {
	if(selected) {
		selected = null;
		$over.css("border-color", "red");
		$grid.mousemove(overHandler);
		$label.val("");
		return;
	}
	
	var tile = (+$tilesize.val()),
		paddingx = (+$paddingx.val()),
		paddingy = (+$paddingy.val()),
		roundx = tile + paddingx,
		roundy = tile + paddingy,
		realx = e.clientX - inneroffset.left,
		realy = e.clientY - inneroffset.top,
		width = +$width.val(),
		height = +$height.val(),
		x = Math.floor(realx / roundx),
		y = Math.floor(realy / roundy),
		value = labels[x+"x"+y+"x"+width+"x"+height] || "";
	
	selected = [x, y, width, height];
	$over.css("border-color", "green");
	$(this).unbind("mousemove");
	$label.focus().val(value);
}

function grid(size, paddingX, paddingY) {
	if(size <= 1) return;
	var width = $sprite.width(),
		height = $sprite.height(),
		i = 1, l = Math.ceil(width / (size + paddingX)),
		j = 1, k = Math.ceil(height / (size + paddingY)),
		html = "";
	
	//add x axis
	for(;i<=l;i++) {
		html += "<div style='top:0; left:"+(i * (size + paddingX) - paddingX)+"px; border-right-width:"+(paddingX+1)+"px; height:"+height+"px;'></div>";
	}
	
	//add y axis
	for(;j<=k;j++) {
		html += "<div style='top:"+(j * (size + paddingY) - paddingY)+"px; left:0; border-bottom-width:"+(paddingY+1)+"px; width:"+width+"px;'></div>";
	}
	
	$inner.html(html);
}

function gridHandler(e) {
	grid(+$tilesize.val(), +$paddingx.val(), +$paddingy.val());
}

function overHandler(e) {
	if(+$tilesize.val() <= 1) return;
	
	var tile = (+$tilesize.val()),
		paddingx = (+$paddingx.val()),
		paddingy = (+$paddingy.val()),
		roundx = tile + paddingx,
		roundy = tile + paddingy,
		realx = e.clientX - inneroffset.left,
		realy = e.clientY - inneroffset.top,
		width = +$width.val(),
		height = +$height.val(),
		x = Math.floor(realx / roundx) * roundx,
		y = Math.floor(realy / roundy) * roundy;
		
	$over.css({left: x, top: y, width: (width * (tile + paddingx) - paddingx-1), height: (height * (tile + paddingy) - paddingy-1)});
}