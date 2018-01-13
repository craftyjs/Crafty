# Crafty JS [![Travis Build Status](https://travis-ci.org/craftyjs/Crafty.svg?branch=develop)](https://travis-ci.org/craftyjs/Crafty) [![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/craftyjs/Crafty?svg=true&branch=develop)](https://ci.appveyor.com/project/starwed/crafty) [![Sauce Test Status](https://saucelabs.com/buildstatus/mucaho)](https://saucelabs.com/u/mucaho)

Crafty is a JavaScript game library that can help you create games in a structured way…

Key Features:

* Entities & Components - A clean and decoupled way to organize game elements. No inheritance needed!
* Eventbinding - Event system for custom events that can be triggered whenever, whatever and bound just as easily.
* No dom manipulation or custom drawing routines required.

Other Goodies:

* Thriving community - Help is readily available in the forum.
* Community modules - A growing collection of user-generated code you can use.
* Pure JavaScript - No magic. Works in all major browsers and can be combined with your favorite js library.


## Using Crafty

A simple game of pong:
```javascript
Crafty.init(600, 300);
Crafty.background('rgb(127,127,127)');

//Paddles
Crafty.e("Paddle, 2D, DOM, Color, Multiway")
    .color('rgb(255,0,0)')
    .attr({ x: 20, y: 100, w: 10, h: 100 })
    .multiway(200, { W: -90, S: 90 });
Crafty.e("Paddle, 2D, DOM, Color, Multiway")
    .color('rgb(0,255,0)')
    .attr({ x: 580, y: 100, w: 10, h: 100 })
    .multiway(200, { UP_ARROW: -90, DOWN_ARROW: 90 });

//Ball
Crafty.e("2D, DOM, Color, Collision")
    .color('rgb(0,0,255)')
    .attr({ x: 300, y: 150, w: 10, h: 10,
            dX: Crafty.math.randomInt(2, 5),
            dY: Crafty.math.randomInt(2, 5) })
    .bind('UpdateFrame', function () {
        //hit floor or roof
        if (this.y <= 0 || this.y >= 290)
            this.dY *= -1;

        // hit left or right boundary
        if (this.x > 600) {
            this.x = 300;
            Crafty("LeftPoints").each(function () {
                this.text(++this.points + " Points") });
        }
        if (this.x < 10) {
            this.x = 300;
            Crafty("RightPoints").each(function () {
                this.text(++this.points + " Points") });
        }

        this.x += this.dX;
        this.y += this.dY;
    })
    .onHit('Paddle', function () {
        this.dX *= -1;
    });

//Score boards
Crafty.e("LeftPoints, DOM, 2D, Text")
    .attr({ x: 20, y: 20, w: 100, h: 20, points: 0 })
    .text("0 Points");
Crafty.e("RightPoints, DOM, 2D, Text")
    .attr({ x: 515, y: 20, w: 100, h: 20, points: 0 })
    .text("0 Points");
```
_Left paddle is controlled by `W` & `S`, right paddle by `UpArrow` & `DownArrow`._   
[Check it out online and try to modify it yourself here](https://jsfiddle.net/mucaho/yL3v48r6/).

## Developing

If you want to fix a bug, please submit a pull request against the development branch.  Some guides to help you can be found [on the wiki](https://github.com/craftyjs/Crafty/wiki)

If you would like to make larger contributions please catch us in the [forum](https://groups.google.com/forum/?fromgroups#!forum/craftyjs) and we will help you get started. Much appreciated :-)


### Quick build instructions

The easiest way to build crafty uses [gruntjs](http://gruntjs.com/), which requires [node](nodejs.org/) and [npm](https://npmjs.org/).  If you have grunt, node, and npm already installed, then run `npm install` from Crafty's root directory.  (This will pull down about 30MB of node packages.)  From then on, just run `grunt` to build.

You can also use [yarn](https://yarnpkg.com/) instead of npm.

([Full instructions here](https://github.com/craftyjs/Crafty/wiki/Building).)
