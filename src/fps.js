  /**@
    * #FPS
    * @category Core
    * @trigger MessureFPS - each second
    * Component to last X FPS Messurements
    * @example
    * 
    * Crafty.e("2D,DOM,FPS,Text").attr({maxValues:10}).bind("MessureFPS",function(fps){
    *   this.text("FPS"+fps.value); //Display Current FPS
    *   console.log(this.values); // Display last x Values
    * })
    */
  Crafty.c("FPS",{
         values:[],
         maxValues:60,
        init:function(){
            this.bind("MessureFPS",function(fps){
                if(this.values.length > this.maxValues) this.values.splice(0,1);
                this.values.push(fps.value);
             });
        }
    });