
Crafty.extend({
    diamond:{
          _grid: {
            width: 0,
            height: 0,
            ratio:0
        },
        _vp:{
            x:0,
            y:0
        },
        init:function(width, height){
            this._grid.width = width;
            this._grid.height = height;
            this._grid.ratio = height/width;
            this._vp.x = Crafty.viewport._x;
            this._vp.y = Crafty.viewport._y;
            
            return this;
        },
        place:function(x,y,z){
           console.log(this.pos2px(x,y,z))
        },
      
        pos2px:function(x,y,z){
            return{
                top:(x-z)*Math.cos(Math.atan(this._grid.ratio))+this._vp.x,
                left:-(y+(x+z)*Math.sin(Math.atan(this._grid.ratio)))+this._vp.y
            }
        }
       
    }
});

Crafty.c("DiamondIso",{
   iso:{
       width:0,
       height:0,
       depth:0
   },
   init:function(){
       
   } 
});
