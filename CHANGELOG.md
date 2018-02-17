## 0.9.0

A large number of performance improvements lead to a larger than normal set of breaking changes in this release.  There was some refactoring of control systems, and built-in support for freezing entities allows for some performance optimizations when spawning and destroying large numbers of identical entities.

### New features
- Several internal changes to how input and control events are dispatched.  (#1121, also for an overview https://github.com/craftyjs/Crafty/projects/1)
	- Mouse scroll supported (#1115)
- Properties shorthand for systems (#1122) and entities (#1096), allowing simpler definition of getter/setter behavior
- Support for freezing/unfreezing entities (#1087), which essentially remove an entity from the gamestate while preserving its internal state.  This allows useful optimizations such as reusing entities. 
- Support setting the size of a custom stage element (#1154)
- Allow passing a list of components as an argument list when calling `requires` (#1150)
- Allow sprite animations to be specified with a list of named positions (1091, 1114)
- Allow controls to be destroyed, and fire events on creation/destruction #1133
- Several improvements to input events (#1121)
- Add `ox` and `oy` properties that get and set the position of the entities origin on the stage
- Bind the callbacks in a components `event` prop before running `init`(#1131)
- Allow specifying multiway behavior when calling fourway (#1094)
- "SetStyle" event emitted when using the `.css` method on DOM entities.

### Breaking changes

- **Major**: Built-in components moved to use "UpdateFrame" rather than "EnterFrame".  "EnterFrame" is still fired once per frame, before the "UpdateFrame" event, and so will occur before things like "Motion" have been processed. #1034
- **Major**: The "Moved" event is removed completely (use "Move" instead) #1146
- The 'Motion' component will fire the "Move" event once per tick, rather than separately for x/y motion #1146
- The event handlers declared using the `events` property shorthand are now bound *before* `init()` is run, instead of after
- The map.search previously took a flag that controlled whether it would filter the results.  For performance reasons, this behavior has now been split into two methods: `search` and `unfilteredSearch`. #1144
- The results of the internal _SAT method now return nx and ny as top level properties `{overlap, nx, ny}` rather than as a nested normal object `{overlap, normal {nx, ny}}`. #1147
- The 'Rotate' event now only contains the rotation amount in degrees.  The `rotate` method signature now takes a set of parameters rather than the 'Rotate' event object.  #1145
- Internally, _cascade now handles linear motion of any attached entities, while _cascadeRotation handles their rotation. #1145
- Changes to touch events:
	- TouchStart and TouchEnd are no longer triggered when a finger enters or leaves entity. They are now triggered only once, when a finger is pressed or raised on the touch surface, no matter which entity was targeted.
	- TouchOver and TouchOut replace those events, which are triggered when a finger enters or leaves the entity.
- Crafty.selected now defaults to true rather than false

### Bug fixes and optimizations
- Fix a bug when when destroying pointer entities could result in double-decrementing the pointer entity counter for their layer #1143
- Bugfix for weird behavior with cancelTween (1113)
- A large number of optimizations to simplify events and allocate fewer object.  These effect:
	- How the 'Motion' component fires events #1146
	- spatial map search and collision algorithms #1147
	- how the 'Rotate' event fires #1145
	- the "Particles" component; should now render more like other standard graphics components #1132, #1141
	- the `Crafty("component")` selector (1117)
        - How Canvas partial redraws work (bnow rely on the spatial map grid struture as an optimization in the common case) (#1125)
	- Misc allocation fixes (#1136, #1137, #1138)

## 0.8.0
Several important new features: raycasting, control over webgl shaders, a new system for wiring up inputs to entities, and more versatile graphics layers.

Only minor breaking changes in this release.


**New features**
- The default WebGL shaders can now be overridden for existing components
- Raycast collision checking is now supported
- A full revamp of how graphics layers are implemented:
  - Multiple instances of the same layer type are supported
  - Static (UI) layers are supported, along with more general parallax effects
  - The z-order of rendering layers can be specified
- A revamp of how "Multiway" and company are implemeneted:
  - A new "Control" system that maps specified user input to triggered event commands
  - A "Controllable" entity that makes it simple to bind to these events
- Text can now be dynamically generated each frame for the "Text" component
- Better control over text alignment on Canvas
- Changing the timer steptype now fires an event
- Graphics layers created using Crafty.s
- Pause supported by particle and delay components
- Easier to specify animations when the sprite spans multiple rows
- "Jumper" component can now be triggered directly 

**Breaking changes**
- All drawing-related methods of the "2D" component moved to a new "Renderable" component. (This should only affect custom draw code -- WebGL/Canvas/DOM components automatically require "Renderable".)
- "Multiway" and company have a different implementation with slightly different behavior in some corner cases.  Triggering keyboard events directly on these entities will no longer work -- instead, trigger the related control events.
- If you were previously setting `text-align` via CSS, you might need to switch to explicitly calling the new `textAlign` method.

**Bug fixes**
- WebGL entities unregistered correctly
- Fixes to "Gravity" component
- Fixed issue where audio could continue repeating when only 1 play is specified
 
**Project**
- Open sauce tests
- Updated node packages; switch to yarn over npm
- Numerous documentation fixes

[Commits since the last version](https://github.com/craftyjs/Crafty/compare/0.7.1...0.8.0-rc2).

## 0.7.1

A minor update with a few fixes.

* Including Crafty cross-domain should no longer throw an uncaught exception when checking localStorage
* Bug unregistering WebGL entities for some component types, causing the max entities limit to be reached too quickly
* Fixes to the release process to ensure that bower release functions correctly

[commits](https://github.com/craftyjs/Crafty/compare/0.7.0...0.7.1)

## 0.7.0

Contains a lot of new functionality and bug fixes.

**Highlights**

* WebGL support for Image, Sprite, and Color.  (Simply switch from Canvas or DOM to WebGL -- rendering exactly matches the other backends.)
* A new motion system with more flexibility.
* Shortcuts for common operations

**Breaking changes**

* Motion components now take speeds in px/second instead of px/frame.  ([Conversion](https://github.com/craftyjs/Crafty/pull/923#issuecomment-120718636))
* You may notice slight differences in jump / gravity behavior even after conversion. (see [#905](https://github.com/craftyjs/Crafty/issues/905)).
* Polygons are declared using the syntax `[x0,y0,x1,y1..]` instead of `[[x0,y0],[x1,y1]..]`
* Changes to the diamondIso api
* Crafty.DOM and Crafty.Canvas renamed to Crafty.domLayer and Crafty.canvasLayer respectively

**Full change list**

**New core features**

* Two common init operations were given shortcuts when defining a component:
  * The `events` property lets you specify a set of event handlers directly
  * The `required` property lets you specify a list of components to add
* Animated properties (both "Tween" and viewport functions) now support a variety of easing types
* Support for multitouch events (has to be explicitly enabled)
* Objects can now be declared as a system using `Crafty.s()`.  This gives them init and event methods much like entities.
* Support for WebGL as a rendering layer
* New MouseWheel event that triggers globally like a keyboard event

**Node support**

* Explicitly headless builds are now possible
* Local storage support for node

**2D functionality**

* `pos` and `mbr` functions now accept an optional object to assign the x/y/w/h properties to, instead of always creating a new one
* Fix a bug in the SAT algorithm that could report collision depth incorrectly in some circumstances
* Optimize polygon to use a flat array, instead of an array of points.
* `Crafty.polygon` now has a `clone()` method if you want to reuse the same polygon in multiple components.
* Revamp of the diamonIso functionality

**Better motion components**

There are several new components that handle moving objects, and existing components like TwoWay and Gravity were refactored to use them
* "Motion": for handling two dimensional motion -- allows you to set acceleration and velocity
* "AngularMotion": For handling rotation
* "Supportable": For handling platform behavior
* Multiway and friends now use Motion internally, and so work properly with Crafty's timer step types.  
* TwoWay now uses Supportable.


**Bug fixes**

* Switching Sprite components sometimes failed to update the image when using DOM components
* The Canvas context was mismanaged when entities were both rotated and flipped
* Mobile positioning was handled weirdly, resulting in both layout and touch event bugs
* Various bugs with disableControls
* Numerous small issues with documentation
* Problems with event cancelling	
* Fixed a long standing issue where DOM sprites blinked and flickered in Chrome
* Numerous bug fixes related to calling `Crafty.stop()`.
* A use of constructor.name which broke IE9
* viewport.follow interacted badly with viewport.scale
* explicitly declared viewport.bounds incorrectly mutated when viewport.scale was called with clamp-to-entities enabled.
* Declaring events and then removing them had a performance impact

**Internal Improvements**

* Source files are now logically organzied into directories, and many monolithic files were broken into smaller units
* Graphics layers are now more loosely coupled to core, preparing the way for arbitrary layers
* Refactored event handling to be more consistent
* Each commit into develop triggers an automatic build on Travis which is uploaded to the `Crafty-Distro` repo.
* Simpler scripts for generating documentation data as a json file

[commits](https://github.com/craftyjs/Crafty/compare/0.6.3...0.7.0)

## 0.6.3

A lot has changed since last time, no breaking changes, but a lot of optimizations.

* Removed support for old browsers (IE7 - Getter Setters)
* New Crafty Component Model which means you can bind to values changing like Backbone events
* New function Crafty.pixelart(true);
* Improved loader functionality
* Remove of Craftycomponent.com module loader
* Lot of bugs fixed and tests added
* Improved tests setup

[commits](https://github.com/craftyjs/Crafty/compare/0.6.2...0.6.3)

## 0.6.2

* This release removes support for IE8!
* New local storage interface

Several Viewport fixes!

* Rework and improve viewport animations such as zoom and pan
* Fix error with canvas combined scale+translation
* Altering viewport dimensions now automatically affects the canvas and DOM stage as well
* Prevent custom bounds from being overwritten by _clamp
* No longer forces fullscreen mode on mobile

Other fixes and enhancements
* Fix translation bug in Chrome 32+
* Resolve conflict with requireJS
* Add line-height and font-variant to DOM text entities.
* Improve behavior of "Gravity" component.
* Add `.get` method to crafty core.  (Returns a matched selection as an explicit array of elements)
* Don't steal touch events from inputs+textareas
* Added `offsetBoundary` to 2D; for custom drawing code
* Fixed odd bug where CSS wasn't set in webkit browsers during DOM SpriteAnimation
* Collision hitboxes now work even if they extend outside of the entity.
* Added Crafty.pixelart() method to demand crisp pixels when upscaling
* Allow a sprite-map border to be specified
* "SpriteAnimation" now respects all sprite-map options
* Crafty.frame works correctly now

Development

* Some reorganization of the source files
* Added grunt-contrib-connect task for use as a local file server
* Reorganized qunit tests; now run as two files, and checked by jshint

[commits](https://github.com/craftyjs/Crafty/compare/0.6.1...0.6.2)

## 0.6.1

* Fix bower compatibility

[commits](https://github.com/craftyjs/Crafty/compare/0.6.0...0.6.1)

## 0.6.0

**Notable changes and new features**

See the associated documentation pages for more info
* Substantial reworking of how "SpriteAnimation" works
 * Not backwards compatible
 * Different set of methods, and animation durations defined in ms instead of frames
* The game loop is now customizable to some extent
 * EnterFrame events are now passed the time since the last frame.
 * *Should* allow for better performance for some types of games
 * As a new feature, there might still be some uncaught bugs!
* Refactoring of the viewport functions -- drastically improved performance
* New binding methods
 * One time events with one()
 * Non-duplicated events with uniqueBind()
* The `remove` method of a component is now run on removal/destruction.  (It's like the opposite of `init`)
* New set of Debug components

**Known issues**
* Poor behavior in IE8 
* Some of the viewport transitions do not animate correctly

**Improvements/bug fixes**
* Fix to centerOn for non-zero origins
* DOM sprites now scale to entity size
* Collision hitboxes now automatically match the entities dimensions by default
* Entities trigger a new "Resize" event when their dimensions change
* Optimizations to how _attr and cascade work
* Fix errors with "2D" methods isAt, contains, and within when an entity is rotated.
* Each stage of the game loop now has an associated event that measures how much time passed.
* "SceneChange" now called *before* the scene init function is run.  
* New "SceneDestroy" event.
* "Isometric" place method works now; several other fixes to isometric behavior
* Crafty audio can now play the same sound file multiple times such that it overlaps with itself
 * Audio now has a default limit of 7 simultaneous sounds playing.   (Use audio.setChannels to change.)
* Improvements to WiredHitBox and SolidHitBox
* getId() method added as a more readable way of getting an entity's ID.
* Multiway now works when either x or y speed is 0
* Internal change to use a triggered event for scene rendering instead of a direct function call
* Fix a bug when rotating an entity with rotated child entities
* Fix a bug when stopping a specific sound
* Change to viewport setter/getter to fix an IE problem
* Wrap font-family property in strings to allow fonts with spaces in the name
* Fix image loader bug in IE  (That was caused by a workaround for a Webkit bug!)
* Canvas entities at non-integer positions now correctly calculate their drawing region (no more tracers)
* Sprites properly require the "2D" component
* Fix some odd behavior with isometric entities; 
* Performance improvements in a few cases
* Changes to how Gravity handles collisions with platforms
* Crafty.audio.play now returns the audio element used to play the sound
* A new event fired when an object's hitbox is changed
* Add a new property (avoidCss3dTransform) to DOM elements that disables CSS3D transforms in all browsers
* An event is now triggered when a particle animation ends
* Return something useful when using Crafty.asset
* Improve how TwoWay uses keyboard events
* Improve memory usage of Draggable components
* color and sprite components work together now

**Development features**
* Crafty now uses the [gruntjs](http://gruntjs.com/) framework for building and development work.
 * Adds features like jsvalidation, linting and automated running of qunit tests to the build process
 * New doc generator (written in CoffeeScript)
 * Use browserify+CommonJS to generate crafty.js instead of simple concatenation
 * Source maps in dev builds
 * Everything now requires nodejs instead of php.
* Many more unit tests!

[commits](https://github.com/craftyjs/Crafty/compare/0.5.4...0.6.0)

## 0.5.4
**June 2013**

* Added a workaround for a webkit bug that prevented the load callback from triggering when using images that were already loaded.  (This often caused Tiled-Map-Importer to fail).
* Rotation now works properly for elements with children attached, including collision areas
* The "Text" component now provides a default font size and family ("10px sans-serif") making it possible to set one and not the other; entities no longer share font information; DOM text can be set to be unselectable
* Inputs and textareas should work properly with canvas now
* "Delay" component's `delay` now allows for repeating events; returns the proper result
* Canvas and general drawing performance should be improved
* indexedDB implementation is updated
* Setting `_alpha=0`  and `visible=false` will now work properly
* Keyboard events should now work properly in Opera.
* When initializing Crafty, you can provide an element to use as the stage

*Known Issues*

* Multiple issues when changing the viewport
* Quirks with SpriteAnimation in some corner cases
	
*Misc bug fixes*

* Crafty should now be noticeably less janky on Firefox
* Setting a "2D" attribute to it's current value will no longer trigger a "Move" event
* Setting the viewport scale before the canvas is initialized now works
* "Hitbox" related events are now unbound
* Fixed memory leak in "Delay"
* "Tint" now has sensible defaults
* Missing files added to crafty-local.js
* Crafty.unbind("EventName") will now unbind *all* globally bound functions to an event, if no function is specified.
* The results of Crafty("*") are now consistent with Crafty("ComponentName")
* addComponent now checks to see if the component already exists on an entity
* Bugs fixed when destroying entities which are bound through attach() together
* entity-factory has been removed (It was broken and redundant)
* Fixed some bugs that caused larger than necessary areas of the screen to be redrawn in some cases (such as creating new entities)
* Fixed a bug with "Twoway" when jump speed is zero
* disableDrag no longer triggers "StopDrag" when no drag is in progress
* the "NewComponent" event now passes an array of the new components
* new audio.remove() method for removing sounds
* Fixed a canvas bug where alpha pixels could be drawn multiple times

*Demos*

* Demos now use crafty-local.js rather than crafty.js

*Documentation*

* Many small improvements
* Fixed a bug that prevented documentation for the "Particle" component from being generated

*Tests*

* Core and stage should now all pass
* Several tests added

[commits](https://github.com/craftyjs/Crafty/compare/0.5.3...0.5.4)

## 0.5.3
**November 2012**
* allow svg images in loader
* detach from parent when destroyed to fix memory leak
* better handling of corner cases in hashmap by using Math.round
* improved documentation
* other bugfixes and small improvements.

[commits](https://github.com/craftyjs/Crafty/compare/0.5.2...0.5.3)

## 0.5.2
**October 2012**
* For autoPause = true, check that game is actually paused on window blur before pausing
* Added ability to pause/unpause/togglePause of individual audio objects
* better input handling for Text component
* Improved support for local storage including IE10 and new versions of Chrome and FF
* Crafty.viewport.bounds variable can be used to override the game area that is normally calculated by Crafty.map.boundaries()

[commits](https://github.com/craftyjs/Crafty/compare/0.5.1...0.5.2)

## Crafty Builder 
**September 2012**
* No improvements to the Crafty engine was released this month. Efforts were spend on: 
* Online IDE www.craftybuilder.com Expect many changes in the future
* a major rewrite of the drawing system. See https://groups.google.com/forum/?fromgroups=#!topic/craftyjs/b73gpKLE7nE


## 0.5.1 
**August 2012**
* CraftyStop is no longer triggered when the game is paused
* Fix bug that prevented inputs from triggering when game is paused
* Added FPS component to measure and display fps rate
* Crafty.diamondIso added
* Fix the startDrag function
* fix Crafty.pause() in Firefox
* SpriteAnimation .isPlaying() fixed
* Crafty.addEntityFactory and Crafty.newFactoryEntity allows for the repeatable creation of an Entity
* documentation improved
* documentation for Crafty.math.Vector2D and Crafty.math.Matrix2D added (lots of stuff!)

[commits](https://github.com/craftyjs/Crafty/compare/0.5.0...0.5.1)

## 0.5.0
**july 2012**
* fixed IE bug
* improvements to touch support
* viewport is reset when scene is called
* mute, unmute and toggle sound fixed/added
* only update css style for DOM entities when changed. This improves performance and mitigates a problem on Chrome where it will download the same images again and again
* in Multiway allow subsequent calls to the constructor to change settings
* Crafty.stop(true) resets all state so you can start a new (or the same) game on the page

[commits](https://github.com/craftyjs/Crafty/compare/0.4.9...0.5.0)

## 0.4.9
**June 2012**
* Crafty.selected indicates if the stage has focus. If so preventDefault and stopPropagation is called on keyboard events to prevent scrolling of the page.
* particles renamed to Particles and the stage is now cleaned when the component is removed.
* Improved module URI detection to allow for HTTPS:// and FILE://
* Added 2D.unflip(dir)
* Adjusted how "Change" is triggered on flipping to minimize flooding
* fix #243 fix areaMap for canvas
* Added support for ZQSD keys in Fourway and Twoway components (for azerty keyboard layout)
* Fixes #252. Gravity and Multiway can now be used on the same entity.
* Modified the Gravity constant.
* Fix cross browser issue with sound.
* Crafty.DOM.inner.x and y are now calculated correctly
* Added Crafty.viewport.scale
* Crafty.asset introduced as getter and setter for assets. Use this instead of the Crafty.assets array!
* Fix SpriteAnimation so it plays last frame of animation
* .setName() function on entities used by DebugBar
* Improvements on mobile support
* Added Crafty.device
* Lots of documentation added

[commits](https://github.com/craftyjs/Crafty/compare/0.4.8...0.4.9)

### 0.4.8
**May 2012**
* entity.image() fixed for canvas entities
* support different polygons for collision checking and mouse events
* Loader creates new Image objects only if there is no existing, also for audio.
* Fixed sounds, added volume parameter to play function
* More documentation
* Better layout of the Documentation

[commits](https://github.com/craftyjs/Crafty/compare/0.4.7...0.4.8)

### 0.4.7
**April 2012**
* Fix bug with padding in sprite animations
* Fix bug in math.randomElementOfArray
* Improved documentation for SpriteAnimation and parts of core
* this._flipX and this._flipY support for canvas entities

[commits](https://github.com/craftyjs/Crafty/compare/0.4.6...0.4.7)

### 0.4.6
**Marts 2012**
* Better documentation for internals, including HashMap and DrawManager.
* Crafty.module supports uppercase versions (RELEASE etc.) and now uses craftycomponents.com as default repo
* .color() now acts as a getter
* Rename .delay to .timeout and introduce a new Delay component that is smarter about game pause etc.
* Fix the play sound forever issue
* Crafty.isPaused() returns whether the game is paused or not.
* Better support for tween chaining
* Remove the div representation when DOM component is removed from entity. This enables you to switch between DOM and canvas without polluting the dom.
* .toggleComponent added
* .getDomId added to DOM component
* .dragDirection added to Draggable component

[commits](https://github.com/craftyjs/Crafty/compare/0.4.5...0.4.6)

### 0.4.5
**February 2012**
* Crafty.module() is used to load community components from craftycomponents.com
* Crafty.math added with lots of vector, matrix and other useful functions.
* randRange() renamed to math.randomInt()
* persist component renamed to Persist
* SceneChange event triggered when a scene is played
* Crafty.storage added. It's an abstraction over the different implementations of local storage providing basic save/load functionality across sessions
* New viewport functions: follow, centerOn, zoom, pan, mouselook
* Crafty.scene optionally accepts an uninit function as a third parameter when defining a scene.
* New isometric functions: pos2px, px2pos ,centerAt ,area,slice
* The API documentation is now more exhaustive than ever :-)
* .font is removed. Use .css to set style property instead.
* e.mouseButton added to all mouse events to normalize across browsers. Used like: if(e.mouseButton == Crafty.mouseButtons.RIGHT) ...
* .destroy() now destroys all attached entities.
* MouseMove event added.
* DoubleClick event added.
* Text component supports canvas
* Text component supports evaluating a function with the entity bound to this.
* Better handling of pausing/unpausing when the user changes tabs
* Crafty.audio.mute can take a bool.
* Lots of bug fixes.

[commits](https://github.com/craftyjs/Crafty/compare/0.4.4...0.4.5)

### 0.4.4
**January 2012**
* _SAT now also returns normal of side hit
* Changed keys are passed as data for the Change event
* Added support for circle collision with Crafty.circle, which behaves like Crafty.polygon
* Added TweenEnd event. It takes the Tweened property as an argument
* Added HTML component.

[commits](https://github.com/craftyjs/Crafty/compare/0.4.3...0.4.4)

### 0.4.3
* CSS 3D transforms
* .attach() takes multiple objects
* Fixed bug with getClientBoundingRect in FireFox
* DOM elements get components added as classes
* Fixed Canvas redraw bugs
* Animate renamed to SpriteAnimation
* Added basic mobile support
* Fixed mousedown triggering twice
* Draggable bugs fixed
* Sprite takes a tile height if not square
* Event names changed to PascalCase

[commits](https://github.com/craftyjs/Crafty/compare/0.4.2...0.4.3)

### 0.4.2
* Faster redraw for rotated entities and repeating background in canvas
* Added a Crafty.settings object
* Smaller game loop
* Started mobile support (not ready yet)
* Fixed a bug with DOM z-indexes being lower than the canvas
* Added a smaller setter function. Removed getter
* Removed unused components, Group, Health and Score.
* Fixed rotation bug for IE6
* .css bug fixed
* Added a namespace for DOM methods (Crafty.DOM)
* Fixed bug with viewport triggering mousedown twice
* Mouse events take into account the viewport
* Bugs in Draggable component fixed
* Fixed Full screen mode resize bug
* Added a namespace for DOM methods (Crafty.DOM)

[commits](https://github.com/craftyjs/Crafty/compare/0.4.1...0.4.2)

### 0.4.1
* Getters and setters added
* Pause bug fixed

[commits](https://github.com/craftyjs/Crafty/compare/0.4...0.4.1)

### 0.4
* .css() should accept both JS and CSS notation
* .requires() method for adding components if not already added
* Detect the browser ext (moz, webkit, o)
* IE rotation and transparency support
* Faster Draw Manager for canvas and Dom
* Tween component
* Fixed an error in addEvent (Leo Koppelkamm)
* Collision now has a justStoppedHitting (Leo Koppelkamm)
* Particles (Leo Koppelkamm)
* Faster mouse events
* Components now use title case
* Crafty.pause method. Invoked when leaving the window or tab
* Fixed crashing after inactivity
* Global events, use Crafty.bind and Crafty.trigger
* Repetition count for Animation component (Leo Koppelkamm)
* Fixed typeahead find bug
* .isDown() method for Controls component
* Faster scrolling for DOM and canvas
* .delay() and .requires() is chainable (sorenbs)
* .DOM() will remove the previously created DOM element
* Crafty.timer.getFPS() returns the current FPS (Leo Koppelkamm)

[commits](https://github.com/craftyjs/Crafty/compare/0.3.2...0.4)

### 0.3.2
* Fixed a collision bug

[commits](https://github.com/craftyjs/Crafty/compare/0.3.1...0.3.2)

### 0.3.1
* Window resize even on fullscreen
* Use scrollTop and scrollLeft
* Bug with .rotate()

[commits](https://github.com/craftyjs/Crafty/compare/0.3...0.3.1)

### 0.3
* Unit tests
* Use the inbuilt canvas background repeat (createPattern)
* SAT collision
* Window resize
* defineProperty for IE9
* Variable frame rate
* Alpha - thanks to Josh Tynjala
* areaMap will automatically offset when a polygon is passed - thanks to Adrian Gaudebert
* Drawing optimization
* persistant entities through scenes
* .visible
* Collision uses MBR, not using Crafty() use Crafty.hashMap()
* More Audio instances - thanks to Josh Tynjala
* Draggable component
* Physics component
* Loader accepts onProgress and onError callbacks with info on what is loaded and percentages - thanks to Josh Tynjala

[commits](https://github.com/craftyjs/Crafty/compare/0.2.1...0.3)

### 0.2.1
**21/1/2011**
* Global assets
* Use of '*' in selector engine to select all entities
* Bug fix for DOM elements using the mouse component

[commits](https://github.com/craftyjs/Crafty/compare/0.2...0.2.1)

### 0.2
**13/1/2011**
* Audio degrades without error in IE
* .detach() method to undo the effects of .attach()
* Objects will detach on remove event
* Sprite maps can take optional padding values for maps with padding around objects
* Fixed a typeahead bug with controls component
* Onload functions that will be called as soon as Crafty.init() is called
* Support object to detect support for HTML5 features and others
* Loader to load assets before the game starts.
* Rotation implemented

[commits](https://github.com/craftyjs/Crafty/compare/0.1...0.2)

### 0.1
**22/12/2010**
* First release
