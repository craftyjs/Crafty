/**
 * HTML Component
 * --------------
 * allows the insertion of arbitrary HTML into an entity
 */
Crafty.c("HTML", {
	inner: '',
	
	init: function () {
		this.requires('2D DOM');
	},
	
	replace: function (new_html) {
		this.inner = new_html;
		this._elem.innerHTML = new_html;
	},
	
	append: function (new_html) {
		this.inner += new_html;
		this._elem.innerHTML += new_html;
	},
	
	prepend: function (new_html) {
		this.inner = new_html + this.inner;
		this._elemn.innerHTML = new_html + this.inner;
	},
});