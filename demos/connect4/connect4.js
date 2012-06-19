window.onload = function () {
	Crafty.init(600, 500);
	Crafty.canvas.init();

	Crafty.sprite(64, "images/sprite.png", {
		red: [0, 0],
		yellow: [1, 0],
		empty: [2, 0]
	});

	var turn = 0, //turn based
		board = [],
		COLUMN_FULL = -2,
		EMPTY = -1,
		YELLOW = 0,
		RED = 1;

	Crafty.scene("game", function () {

		//generate board
		for (var i = 0; i < 7; i++) {
			board[i] = []; //init board
			for (var j = 0; j < 6; j++) {
				Crafty.e("2D, Canvas, empty").attr({ x: i * 64, y: j * 64 + 100, z: 2 });
				board[i][j] = EMPTY; //set it to empty
			}
		}

		Crafty.c("piece", {
			init: function () {
				this.z = 3;
				this.requires("Mouse, Gravity, Draggable, Tween");
				this.bind("StopDrag", function() {
					var column = Math.round(this._x / 64);
					//this.x = column * 64;
          this.tween({x:column * 64}, 20)
					this.gravity("stopper");
					this.unbind("MouseDown");

					reset(column);
				});
			}
		});

		var current;
		function reset(column) {
			var row = findEmptyRow(column);
			if(row !== COLUMN_FULL && column >= 0 && column < 7) {
				board[column][row] = turn;

				if(checkFour(column, row)) {
					win(turn);
					return;
				}

				turn ^= 1; //alternate turns
				current = Crafty.e("2D, Canvas, piece, stopper," + (turn ? "red" : "yellow")).attr({ x: 495, y: 420 });
			} else {
				//dont' place
        var x=current.x;
        var y=current.y;
				current.destroy();
				current = Crafty.e("2D, Canvas, piece, stopper," + (turn ? "red" : "yellow"))
        .attr({x: x, y: y})
        .tween({x: 495, y: 420}, 20);
			}
		}
		current = Crafty.e("2D, Canvas, piece, stopper, yellow").attr({ x: 495, y: 420 });

		var ground = Crafty.e("2D, stopper").attr({ y: Crafty.viewport.height - 16, w: Crafty.viewport.width, h: 20 });
		var bg = Crafty.e("2D, Canvas, Image").image("images/bg.png").attr({ z: -1 });
	});
	
	Crafty.scene("win", function() {
		var bg = Crafty.e("2D, DOM, Image").image("images/win.png", "no-repeat").attr({w: 600, h: 500, z: -1});
		Crafty.e("2D, DOM, Text").attr({x: 220, y: 200}).text(turn ? "RED" : "YELLOW").css({
        "font-family": "Arial"
        , "font-size": "30pt"
      });
	});

	function win(turn) {
		Crafty.scene("win");
	}

	Crafty.scene("game");//start the game
	function findEmptyRow(column) {
		if(!board[column]) return;
		for(var i = 0; i < board[column].length; i++) {
			if(board[column][i] == EMPTY)
				return i;
		}
		return COLUMN_FULL;
	}

	function checkFour(column, row) {
		if(checkVertical(column, row)) return true;
		if(checkHorizontal(column, row)) return true;
		if(checkLeftDiagonal(column, row)) return true;
		if(checkRightDiagonal(column, row)) return true;
		return false;
	}

	function checkVertical(column, row) {
		if(row < 3) return false;
		for(var i = row; i > row - 4; i--) {
			if(board[column][i] != turn) return false;
		}
		return true;
	}

	function checkHorizontal(column, row) {
		var counter = 1;
		for(var i = column - 1; i >= 0; i--) {
			if(board[i][row] != turn) break;
			counter++;
		}

		for(var j = column + 1; j < 7; j++) {
			if(board[j][row] != turn) break;
			counter++;
		}
		return counter >= 4;
	}

	function checkLeftDiagonal(column, row) {
		var counter = 1;
		var tmp_row = row - 1;
		var tmp_column = column - 1;

		while(tmp_row >= 0 && tmp_column >= 0) {
			if(board[tmp_column][tmp_row] == turn) {
				counter++;
				tmp_row--;
				tmp_column--;
			} else break;
		}

		row += 1;
		column += 1;

		while(row < 6 && column < 7) {
			if(board[column][row] == turn) {
				counter++;
				row++;
				column++;
			} else { break; }
		}
		return counter >= 4;
	}

	function checkRightDiagonal(column, row) {
		var counter = 1;
		var tmp_row = row + 1;
		var tmp_column = column - 1;

		while(tmp_row < 6 && tmp_column >= 0) {
			if(board[tmp_column][tmp_row] == turn) {
				counter++;
				tmp_row++;
				tmp_column--;
			} else break;
		}

		row -= 1;
		column += 1;

		while(row >= 0 && column < 7) {
			if(board[column][row] == turn) {
				counter++;
				row--;
				column++;
			} else break;
		}
		return counter >= 4;
	}
};
