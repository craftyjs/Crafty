/* This is a modified version of mock-phantom-touch-events.
 * 
 * The original mock-phantom-touch-events can be found at https://github.com/gardr/mock-phantom-touch-events
 * 
 * mock-phantom-touch-events is licensed under:
 * 
 * The MIT License (MIT)
 * Copyright (c) 2013 FINN.no AS
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 */

function computedStyle(el, prop) {
    return (
        window.getComputedStyle ? window.getComputedStyle(el) : el.currentStyle
    )[prop.replace(/-(\w)/gi, function (word, letter) {
        return letter.toUpperCase();
    })];
}

function getChildrenSize(container) {
    if (!container) {
        return;
    }
    var children = [].slice.call(container.children, 0).filter(function (el) {
        var pos = computedStyle(el, 'position');
        el.rect = el.getBoundingClientRect(); // store rect for later
        return !(
            (pos === 'absolute' || pos === 'fixed') ||
            (el.rect.width === 0 && el.rect.height === 0)
        );
    });
    if (children.length === 0) {
        return {
            width: 0,
            height: 0
        };
    }

    var totRect = children.reduce(function (tot, el) {
        return (!tot ?
            el.rect : {
                top: Math.min(tot.top, el.rect.top),
                left: Math.min(tot.left, el.rect.left),
                right: Math.max(tot.right, el.rect.right),
                bottom: Math.max(tot.bottom, el.rect.bottom)
            });
    }, null);

    return {
        width: totRect.right - totRect.left,
        height: totRect.bottom - totRect.top
    };
}

/*
    list can be either [[x, y], [x, y]] or [x, y]
*/
function createTouchList(target, list) {
    if (Array.isArray(list) && list[0] && !Array.isArray(list[0])) {
        list = [list];
    }
    list = list.map(function (entry, index) {
        var x = entry[0], y = entry[1], id = entry[2] ? entry[2] : index + 1;
        return createTouch(x, y, target, id);
    });
    return document.createTouchList.apply(document, list);
}

function createTouch(x, y, target, id) {
    return document.createTouch(window, target,
        //identifier
        id || 1,
        //pageX / clientX
        x,
        //pageY / clientY
        y,
        //screenX
        x,
        //screenY
        y
    );
}

//http://stackoverflow.com/questions/7056026/variation-of-e-touches-e-targettouches-and-e-changedtouches
function initTouchEvent(touchEvent, type, touches) {
    var touch1 = touches[0];
    return touchEvent.initTouchEvent(
        //touches
        touches,
        //targetTouches
        touches,
        //changedTouches
        touches,
        //type
        type,
        //view
        window,
        //screenX
        touch1.screenX,
        //screenY
        touch1.screenY,
        //clientX
        touch1.clientX,
        //clientY
        touch1.clientY,
        //ctrlKey
        false,
        //altKey
        false,
        //shiftKey
        false,
        //metaKey
        false
    );
}

function createTouchEvent(elem, type, touches) {
    var touchEvent = document.createEvent('TouchEvent');
    if (Array.isArray(touches)) {
        touches = createTouchList(elem, touches);
    }

    function dispatch(getEvent) {
        initTouchEvent(touchEvent, type, touches);
        if (typeof getEvent === 'function'){
            getEvent.call(elem, touchEvent, elem);
        }
        elem.dispatchEvent(touchEvent);
    }
    dispatch.event = touchEvent;
    return dispatch;
}

function apply(fn, arg, args) {
    return fn.apply(null, [arg].concat(Array.prototype.slice.call(args)));
}

function swipeLeft() {
    return apply(swipe, 'left', arguments);
}

function swipeRight() {
    return apply(swipe, 'right', arguments);
}

function swipeTop(){
    return apply(swipe, 'top', arguments);
}

function swipeBottom(){
    return apply(swipe, 'bottom', arguments);
}

function round(num){
    return Math.round(num);
}

var HORIZONTAL_OFFSET = 45;
var VERTICAL_OFFSET = 10;
function swipe(direction, elem, ms, frames, getEvent) {
    var elemSize = getChildrenSize(elem.parentNode);

    var x;
    var y;
    var from;
    var to;
    var isVertical = direction === 'top' || direction === 'bottom';
    if (isVertical){
        y = elemSize.height;
        x = elemSize.width / 2;

        from = [x*0.95, VERTICAL_OFFSET].map(round);
        to   = [x*1.01, y-VERTICAL_OFFSET].map(round);
    } else {
        // horizontal
        x = elemSize.width;
        y = elemSize.height / 2;
        from = [HORIZONTAL_OFFSET, y*0.98].map(round);
        to   = [x - HORIZONTAL_OFFSET, y*1.01].map(round);
    }

    if (direction === 'right' || direction === 'top') {
        touchActionSequence(elem, from, to, ms, frames, getEvent);
    } else {
        touchActionSequence(elem, to, from, ms, frames, getEvent);
    }
}

function getDiff(fromList, toList){
    return [
        toList[0] - fromList[0],
        toList[1] - fromList[1]
    ];
}

function getXandYFrame(startPoint, diffToWalk, currentProgress){
    return [
        Math.round(
            Math.abs(
                startPoint[0] + (diffToWalk[0] * currentProgress))),
        Math.round(
            Math.abs(
                startPoint[1] + (diffToWalk[1] * currentProgress)))
    ];
}

function touchActionSequence(elem, fromXandY, toXandY, ms, frames, getEvent) {
    frames       = frames || 10;
    ms           = Math.round((ms||1000) / frames);
    // lets find difference from start to end and divide on frames
    var diff     = getDiff(fromXandY, toXandY);
    var counter  = frames;
    var pos             = getXandYFrame(fromXandY, diff, counter/frames);
    var targetElement;

    targetElement   = document.elementFromPoint(pos[0], pos[1]);

    setTimeout(function handler() {
        counter--;
        if (counter) {
            pos = getXandYFrame(fromXandY, diff, counter/frames);
            targetElement = document.elementFromPoint(pos[0], pos[1]);
            createTouchEvent(targetElement||elem, 'touchmove', pos)(getEvent);
            setTimeout(handler, ms);
        } else {
            createTouchEvent(targetElement||elem, 'touchend', [[0, 0]])(getEvent);
        }
    }, ms);
    createTouchEvent(targetElement||elem, 'touchstart', pos)(getEvent);
}

function factory(){
    return {
        _apply: apply,
        _getXandYFrame: getXandYFrame,
        _getDiff: getDiff,
        swipeLeft: swipeLeft,
        swipeRight: swipeRight,
        swipeTop: swipeTop,
        swipeBottom: swipeBottom,
        touchActionSequence: touchActionSequence,
        createTouchEvent: createTouchEvent
    };
}

if (typeof module !== 'undefined' && module.exports){
    module.exports = factory();
} else {
    window.mockPhantomTouchEvents = factory();
}
