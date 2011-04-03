/**@
* #Score
* Keep a score for an entity.
*/
Crafty.c("Score", {
	score: 0,
	
	/**@
	* #incrementScore
	* `public this incrementScore(Number by)`
	*
	* **Parameters:**
	* `by`
	* :   Number Amount to increment the score
	* **Events:**
	* `ScoreDown`
	* : Throws event when subtracted with the score and difference
	*
	* Adds a value onto the overall score for the current entity.
	*/
	incrementScore: function(by) {
		this.score += by;
		
		this.trigger("ScoreUp", {score: this._score, diff: by});
		return this;
	},
	
	/**@
	* #decrementScore
	* `public this decrementScore(Number by)`
	*
	* **Parameters:**
	* `by`
	* :   Number Amount to decrement the score
	* **Events:**
	* `ScoreDown`
	* : Throws event when subtracted with the score and difference
	*
	* Subtracts a value onto the overall score for the current entity.
	*/
	decrementScore: function(by) {
		this.score -= by;
		
		this.trigger("ScoreDown", {score: this._score, diff: by});
		return this;
	}
});