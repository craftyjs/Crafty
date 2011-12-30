/**@
* #Text
* @category Graphics
* @requires DOM
* Component to draw text inside the body of an entity. Only works for DOM elements.
*/
Crafty.c("Text", {
	_text: "",

	init: function () {
		this.bind("Draw", function (e) {
			if (e.type === "DOM") {
				var el = this._element, style = el.style;
				el.innerHTML = this._text;
			}
		});
	},

	/**@
	* #.text
	* @comp Text
	* @sign public this .text(String text)
	* @sign public this .text(Function textgenerator)
	* @param text - String of text that will be inserted into the DOM element. Can use HTML.
	* This method will update the text inside the entity. To modify the font, use the `.css` method
	* inherited from the DOM component.
	*
	* If you need to reference attributes on the entity itself you can pass a function instead of a string.
	* @example
	* ~~~
	* Crafty.e("2D, DOM, Text").attr({ x: 100, y: 100 }).text("Look at me!!");
	*
	* Crafty.e("2D, DOM, Text").attr({ x: 100, y: 100 })
	*     .text(function () { return "My position is " + this._x });
	* ~~~
	*/
	text: function (text) {
		console.log(this.x);
		if (!text) return this._text;
		if (typeof(text) == "function")
			this._text = text.call(this);
		else
			this._text = text;
		this.trigger("Change");
		return this;
	}
});