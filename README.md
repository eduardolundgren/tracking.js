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

[Check the full code of this Hello World example.](https://github.com/zenorocha/tracking.js/blob/docs/examples/hello_world.html)

## About

It brings to web elements tracking techniques of a real scene captured by the camera, through natural interactions from object tracking, color markers, among others, allowing the development of interfaces and games through a simple and intuitive API.

#### Why?
The concept of Natural Interaction proposes interfaces that understand the intentions of the user so that this convey their intentions intuitively interacting with computer systems in the same way makes day-to-day with people and objects. It is in this direction that the areas of interaction Human-Computer (IHC) and Virtual and Augmented Reality (AR), both in accelerated progression to native environments.

#### Who?
Created by Eduardo Lundgren, one of the creators of AlloyUI, involved in many open-source projects, ex-contributor to jQuery and jQuery UI. Graduate in Telecommunications Engineering from UPE and taking a Masters in CS from UFPE. Currently development lead at Liferay.