function iframe(src, base, onload) {
	if(frame) document.body.removeChild(frame);
	
	frame = document.createElement("iframe");
	frame.src = "javascript:;";
	
	//hide the frame
	frame.style.position = "absolute";
	frame.style.left = "-999px";
	frame.style.display = "none";
	
	document.body.appendChild(frame);
	
	//generate the HTML for the frame
	var html, win = frame.contentWindow;
	
	$(frame).load(function(e) { onload.call(win, e); });
	
	html = ["<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\"><html><head>",
			"<scr"+"ipt"+" type='text/javascript' src='"+CRAFTY_SRC+"'></scr"+"ipt>",
			"<base href='"+base+"'/>",
			"<scr"+"ipt"+" type='text/javascript' src='"+src+"'></scr"+"ipt>",
			"</head><body style='margin:0;padding:0'></body></html>"];
				
	//add the HTML
	win.document.open();
	win.document.write(html.join(""));
	win.document.close();
}