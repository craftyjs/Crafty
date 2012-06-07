/* This file aggregates all the src/ files at runtime.
 * You just need to source this file, then any changes in src/ files will be automatically sourced.
 * Therefore, you do not need to regenerate crafty.js (by bulid.sh) anymore each time when you make changes in src/.
 */

(function (window) {
	var include = [
		'core',
		'intro',
		'HashMap',
		'2D',
		'collision',
		'DOM',
		'extensions',
		'canvas',
		'controls',
		'animation',
		'sprite',
		'drawing',
		'isometric',
		'particles',
		'sound',
		'storage',
		'html',
		'math',
		'text',
		'loader',
		'outro'
	],
	l = include.length, i, tr = new XMLHttpRequest(), output = '', url, base = '', scripts = document.getElementsByTagName('script');
	for (i=0; i<scripts.length; i++) {
		if (scripts[i].src.indexOf('crafty-local.js') != -1) {
			base = scripts[i].src.replace('crafty-local.js', '')+'/src/';
			break;
		}
	}	
	
	for (i=0; i<l; i++) {
		url = base+include[i]+'.js';
		tr.open("GET", url, false);
		try {
			tr.send(null);
		}
		catch (e) {
			alert("Your security settings prevent access to the local file-system. \n\r Access to restricted URI denied code 1012");
			break;
		}
		output += tr.responseText;
	}
	
	output += "\n//@ sourceURL=crafty.js";
	
	eval(output);
})(window);
