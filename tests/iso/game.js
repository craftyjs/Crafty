$(function(){
    Crafty.init();
 
    var iso = Crafty.isometric.init(128).grid(64);
   
    for(var y = 0;y<10;y++){
        for(var x = 0;x<10;x++){
            var tile = Crafty.e("Gras","Text").text("X:"+x+"/Y:"+y);
            iso.place(tile,x,y,64);
        }
    }
});