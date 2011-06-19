/**@
* #Text
* @category Graphics
* @requires DOM
* Component to draw text inside the body of an entity. Only works for DOM elements.
*/
Crafty.c("Text", {
	_text: "",
	
	init: function() {
		this.bind("Draw", function(e) {
			if(e.type === "DOM") {
				var el = this._element, style = el.style;
				el.innerHTML = this._text;
			}
		});
	},
	
	/**@
	* #.text
	* @comp Text
	* @sign public this .text(String text)
	* @param text - String of text that will be inseretd into the DOM element. Can use HTML.
	* This method will update the text inside the entity. To modify the font, use the `.css` method
	* inherited from the DOM component.
	*/
	text: function(text) {
		if(!text) return this._text;
		this._text = text;
		this.trigger("Change");
		return this;
	}
});