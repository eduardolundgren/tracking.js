# tracking.js

Change the way you interact with your browser.

## Getting Started

Import the core library:

``` html
<script src="tracking.js"></script>
```

Import the color module:

``` html
<script src="tracker/color.js"></script>
```

Gets the user's camera:

``` javascript
var videoCamera = new tracking.VideoCamera().render();
```

Instantiates tracking by color magenta and displays X, Y and Z positions of the detected area in console:


``` javascript
videoCamera.track({
    type: 'color',
    color: 'magenta',
    onFound: function(track) {
      console.log(track.x, track.y, track.z);
    },
    onNotFound: function() {}
});
```

[Check the full code of this Hello World example.](https://github.com/eduardolundgren/tracking.js/blob/master/examples/hello_world.html)

> **Note:** if you want to run tracking.js examples locally, you're going to need a local server, since `file:///` doesn't work with `getUserMedia()` in some browsers.

> 1. Install Grunt and its dependencies: `npm install .` 
> 2. Run a local server: `grunt server`
> 3. Go to: `http://localhost:9001` and have fun :)

## Structure

* *tracking.js* : Library's core;
* *color.js* : Module for color tracking;
* *human.js* : Module for human tracking.

## Methods

There are some handy classes and chainable methods that you can use to achieve your goal, for example:

* **new tracking.VideoCamera()**

Requests user's camera using WebRTC's `getUserMedia()`.

* **new tracking.VideoCamera().render()**

Render user's camera using a `<video>` element into the DOM.

* **new tracking.VideoCamera().hide()**

Hides the `<video>` rendered into the DOM by `tracking.VideoCamera()`. In order to add information to the scene the `<canvas>` element could be displayed instead of the `<video>`.

* **new tracking.VideoCamera().renderVideoCanvas()**

Renders user's camera using a `<canvas>` element.

## Parameters

When initializing the object `tracking.VideoCamera().track()`, you can optionally specify some parameters, for instance:

* **type** *{string}* : could be `color` or `human`.

``` javascript
new tracking.VideoCamera().track({ 
	type: 'color' 
});
```

### Color tracking

* **color** *{string}* : could be `cyan`, `magenta` or `yellow` (default is `magenta`).

``` javascript
new tracking.VideoCamera().track({ 
	type: 'color',
	color: 'yellow'
});
```

### Human tracking

* **data** *{string}* : could be `eye`, `frontal_face`, `mouth` or `upper_body` (default is `frontal_face`).

``` javascript
new tracking.VideoCamera().track({ 
	type: 'human',
	data: 'eye'
});
```

## Events

* **onFound** : Each time your tracker find something this event will be fired.

``` javascript
new tracking.VideoCamera().track({ 
	onFound: function(track) {
		// do something
	}
});
```

* **onNotFound** : Each time your tracker doesn't find something this event will be fired.

``` javascript
new tracking.VideoCamera().track({ 
	onNotFound: function(track) {
		// do something
	}
});
```

## About

It brings to web elements tracking techniques of a real scene captured by the camera, through natural interactions from object tracking, color markers, among others, allowing the development of interfaces and games through a simple and intuitive API.

#### Why?
The concept of Natural Interaction proposes interfaces that understand the intentions of the user so that this convey their intentions intuitively interacting with computer systems in the same way makes day-to-day with people and objects. It is in this direction that the areas of interaction Human-Computer (IHC) and Virtual and Augmented Reality (AR), both in accelerated progression to native environments.

#### Who?
Created by Eduardo Lundgren, one of the creators of AlloyUI, involved in many open-source projects, ex-contributor to jQuery and jQuery UI. Graduate in Telecommunications Engineering from UPE and taking a Masters in CS from UFPE. Currently development lead at Liferay.

## Team

* Eduardo Lundgren
* Thiago Pereira
* Zeno Rocha
