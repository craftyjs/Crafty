test("Craft.Matrix2D Copy Constructor", function() {
	var n1 = Crafty.math.Matrix2D;
	var n2 = Crafty.math.Matrix2D;
	var n3 = Crafty.math.Matrix2D;
	var n4 = Crafty.math.Matrix2D;
	var list = [n1, n2, n3, n4];
	
	var m = new Crafty.math.Matrix2D(1, 2, 3, 4, 5, 6, n1);
	var n = new Crafty.math.Matrix2D(1, 2, 3, 4, 5, 6, n1, n2, n3, n4);
	
	list.forEach(function(entry) {
		equal(m.a, entry.a, "First cell match");
		equal(m.b, entry.b, "Second cell match");
		equal(m.c, entry.c, "Thrid cell match");
		equal(m.d, entry.d, "Fourth cell match");
		equal(m.e, entry.e, "Fifth cell match");
		equal(m.f, entry.f, "Sixth cell match");
	
		equal(n.a, entry.a, "First cell match");
		equal(n.b, entry.b, "Second cell match");
		equal(n.c, entry.c, "Thrid cell match");
		equal(n.d, entry.d, "Fourth cell match");
		equal(n.e, entry.e, "Fifth cell match");
		equal(n.f, entry.f, "Sixth cell match");
	});
});
