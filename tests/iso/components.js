Crafty.c("BaseTile",{
    init:function(){
        this.addComponent("2D","Canvas","DiamondIso");
        this.iso = {
            width: 64,
            depth: 64,
            height:0
        }
        return this;
    }
})

Crafty.c("Gras",{
    init:function(){
        this.addComponent("BaseTile","spriteGras");
       
        return this;
    }
})