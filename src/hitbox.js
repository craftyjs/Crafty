/**@
* #Collision
* @category 2D
* Components to display Crafty.polygon Array for debugging collision detection
*/
Crafty.c("WiredHitBox", {
    init:function(){
        
        if (Crafty.support.canvas){ 
            var c = document.getElementById('HitBox');
            if(!c){
                c = document.createElement("canvas");
                c.id = 'HitBox';
                c.width = Crafty.viewport.width;
                c.height = Crafty.viewport.height;
                c.style.position = 'absolute';
                c.style.left = "0px";
                c.style.top = "0px";
                c.style.zIndex = '1000';
                Crafty.stage.elem.appendChild(c); 
            }
            var ctx = c.getContext('2d');
            this.requires("Collision").bind("EnterFrame",function(){
                ctx.beginPath(); 
                for(var p in this.map.points){
                    ctx.lineTo(Crafty.viewport.x+this.map.points[p][0],Crafty.viewport.y+this.map.points[p][1]);  
                }
                ctx.closePath(); 
                ctx.stroke(); 
            }); 
        }
       
        return this;
    }
});

Crafty.c("SolidHitBox", {
    init:function(){
        if (Crafty.support.canvas){ 
            var c = document.getElementById('HitBox');
            if(!c){
                c = document.createElement("canvas");
                c.id = 'HitBox';
                c.width = Crafty.viewport.width;
                c.height = Crafty.viewport.height;
                c.style.position = 'absolute';
                c.style.left = "0px";
                c.style.top = "0px";
                c.style.zIndex = '1000';
                Crafty.stage.elem.appendChild(c); 
            }
            var ctx = c.getContext('2d');
            this.requires("Collision").bind("EnterFrame",function(){
                ctx.beginPath(); 
                for(var p in this.map.points){
                    ctx.lineTo(Crafty.viewport.x+this.map.points[p][0],Crafty.viewport.y+this.map.points[p][1]);  
                }
                ctx.closePath(); 
                ctx.fill(); 
            }); 
        }
        
        return this;
    }
});