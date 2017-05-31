var Crafty = require('../core/core.js'),
    document = window.document;

// figure out which eventName to listen to for mousewheel events
var mouseWheelEvent = typeof document.onwheel !== 'undefined' ? 'wheel' : // modern browsers
                        typeof document.onmousewheel !== 'undefined' ? 'mousewheel' : // old Webkit and IE
                        'DOMMouseScroll'; // old Firefox

//initialize the input events onload
Crafty._preBind("Load", function () {
    Crafty.addEvent(this, document.body, "mouseup", Crafty.detectBlur);
    Crafty.addEvent(Crafty.s('Keyboard'), window, "blur", Crafty.s('Keyboard').resetKeyDown);
    Crafty.addEvent(Crafty.s('Mouse'), window, "mouseup", Crafty.s('Mouse').resetButtonDown);
    Crafty.addEvent(Crafty.s('Touch'), window, "touchend", Crafty.s('Touch').resetTouchPoints);
    Crafty.addEvent(Crafty.s('Touch'), window, "touchcancel", Crafty.s('Touch').resetTouchPoints);

    Crafty.addEvent(Crafty.s('Keyboard'), "keydown", Crafty.s('Keyboard').processEvent);
    Crafty.addEvent(Crafty.s('Keyboard'), "keyup", Crafty.s('Keyboard').processEvent);

    Crafty.addEvent(Crafty.s('Mouse'), Crafty.stage.elem, "mousedown", Crafty.s('Mouse').processEvent);
    Crafty.addEvent(Crafty.s('Mouse'), Crafty.stage.elem, "mouseup", Crafty.s('Mouse').processEvent);
    Crafty.addEvent(Crafty.s('Mouse'), Crafty.stage.elem, "mousemove", Crafty.s('Mouse').processEvent);
    Crafty.addEvent(Crafty.s('Mouse'), Crafty.stage.elem, "click", Crafty.s('Mouse').processEvent);
    Crafty.addEvent(Crafty.s('Mouse'), Crafty.stage.elem, "dblclick", Crafty.s('Mouse').processEvent);

    Crafty.addEvent(this, Crafty.stage.elem, "touchstart", this._touchDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "touchmove", this._touchDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "touchend", this._touchDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "touchcancel", this._touchDispatch);
    Crafty.addEvent(this, Crafty.stage.elem, "touchleave", this._touchDispatch);

    Crafty.addEvent(Crafty.s('MouseWheel'), Crafty.stage.elem, mouseWheelEvent, Crafty.s('MouseWheel').processEvent);
});

Crafty.bind("Pause", function () {
    // Reset pressed keys and buttons
    Crafty.s('Keyboard').resetKeyDown();
    Crafty.s('Mouse').resetButtonDown();
});

Crafty._preBind("CraftyStop", function () {
    // Reset pressed keys and buttons
    Crafty.s('Keyboard').resetKeyDown();
    Crafty.s('Mouse').resetButtonDown();
});

Crafty._preBind("CraftyStop", function () {
    Crafty.removeEvent(this, document.body, "mouseup", Crafty.detectBlur);
    Crafty.removeEvent(Crafty.s('Keyboard'), window, "blur", Crafty.s('Keyboard').resetKeyDown);
    Crafty.removeEvent(Crafty.s('Mouse'), window, "mouseup", Crafty.s('Mouse').resetButtonDown);
    Crafty.removeEvent(Crafty.s('Touch'), window, "touchend", Crafty.s('Touch').resetTouchPoints);
    Crafty.removeEvent(Crafty.s('Touch'), window, "touchcancel", Crafty.s('Touch').resetTouchPoints);

    Crafty.removeEvent(Crafty.s('Keyboard'), "keydown", Crafty.s('Keyboard').processEvent);
    Crafty.removeEvent(Crafty.s('Keyboard'), "keyup", Crafty.s('Keyboard').processEvent);

    if (Crafty.stage) {
        Crafty.removeEvent(Crafty.s('Mouse'), Crafty.stage.elem, "mousedown", Crafty.s('Mouse').processEvent);
        Crafty.removeEvent(Crafty.s('Mouse'), Crafty.stage.elem, "mouseup", Crafty.s('Mouse').processEvent);
        Crafty.removeEvent(Crafty.s('Mouse'), Crafty.stage.elem, "mousemove", Crafty.s('Mouse').processEvent);
        Crafty.removeEvent(Crafty.s('Mouse'), Crafty.stage.elem, "click", Crafty.s('Mouse').processEvent);
        Crafty.removeEvent(Crafty.s('Mouse'), Crafty.stage.elem, "dblclick", Crafty.s('Mouse').processEvent);

        Crafty.removeEvent(this, Crafty.stage.elem, "touchstart", this._touchDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "touchmove", this._touchDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "touchend", this._touchDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "touchcancel", this._touchDispatch);
        Crafty.removeEvent(this, Crafty.stage.elem, "touchleave", this._touchDispatch);

        Crafty.removeEvent(Crafty.s('MouseWheel'), Crafty.stage.elem, mouseWheelEvent, Crafty.s('MouseWheel').processEvent);
    }
});
