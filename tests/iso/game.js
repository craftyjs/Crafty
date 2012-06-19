$(function(){
    Crafty.init();
 
    var iso = Crafty.isometric.init(128).grid(64);
   
    for(var y = 0;y<11;y++){
        for(var x = 0;x<11;x++){
            var tile = Crafty.e("Gras","Text").text("X:"+x+"/Y:"+y);
            iso.place(tile,x,y,0);
        }
    }
});