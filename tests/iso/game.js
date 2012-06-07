$(function(){
    var iso = Crafty.isometric.init(128);
    
    for(var y = 0;y<6;y++){
        for(var x = 0;x<6;x++){
            iso.place(x,0,y);
        }
    }
});