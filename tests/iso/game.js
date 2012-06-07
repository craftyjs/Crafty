$(function(){
    Crafty.init();
    var iso = Crafty.isometric.init(128).grid(64);
     
  
   
    for(var z = 0;z<10;z++){
        for(var x = 0;x<10;x++){
            var tile = Crafty.e("Gras");
            iso.place(tile,x*64,0,z*64);
        }
    }
});