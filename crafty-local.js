/* This file aggregates all the src/ files at runtime.
 * You just need to source this file, then any changes in src/ files will be automatically sourced.
 * Therefore, you do not need to regenerate crafty.js (by bulid.sh) anymore each time when you make changes in src/.
 */

(function (window) {
	var i, l, url, pkg,
		tr = new XMLHttpRequest(),
		output = '',
		base = '',
		scripts = document.getElementsByTagName('script');
	
    // Find "base", the path to the crafty folder
    // base + 'package.json' should have the list of filenames, and then 
    // base + filename should be the appropriate file.
    
	for (i=0; i<scripts.length; i++) {
		if (scripts[i].src.indexOf('crafty-local.js') !== -1) {
			base = scripts[i].src.replace('crafty-local.js', '');
			break;
		}
	}
	
	url = base + 'package.json';
	tr.open("GET", url, false);
	try {
		tr.send(null);
	}
	catch (e) {
		alert("Your security settings prevent access to the local file-system. \n\r Access to restricted URI denied code 1012");
		return;
	}
	pkg = JSON.parse(tr.responseText);

	// source files must be concatenated -- they can't be loaded as
	// individual scripts -- because there is a wrapping function
	for (i = 0, l = pkg.files.length; i < l; i++) {
		url = base + pkg.files[i];
		tr.open("GET", url, false);
		try {
			tr.send(null);
		}
		catch (e) {
			alert("Your security settings prevent access to the local file-system. \n\r Access to restricted URI denied code 1012");
			return;
		}
		output += tr.responseText;
	}
	
	output += "\n//@ sourceURL=crafty.js";
	
	eval(output);
}(window));
